import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { hash } from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateUserDto } from '../dto/create-user.dto';

import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },

      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        roles: {
          where: {
            endedAt: null,
          },

          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      roles: user.roles.map((userRole) => userRole.role.name),
    }));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        roles: {
          where: {
            endedAt: null,
          },

          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      roles: user.roles.map((userRole) => userRole.role.name),
    };
  }

  async create(dto: CreateUserDto) {
    const username = dto.username.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        username,
      },

      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Username sudah digunakan');
    }

    const roleNames = Array.from(new Set(dto.roles));

    const roles = await this.prisma.role.findMany({
      where: {
        name: {
          in: roleNames,
        },
      },
    });

    if (roles.length !== roleNames.length) {
      throw new BadRequestException('Terdapat role yang tidak tersedia');
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        username,
        passwordHash,
        isActive: true,

        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
          })),
        },
      },

      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        createdAt: true,

        roles: {
          where: {
            endedAt: null,
          },

          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,

      roles: user.roles.map((userRole) => userRole.role.name),
    };
  }

  async update(id: number, dto: UpdateUserDto) {
   const currentUser = await this.findOne(id);

    const username =
      dto.username !== undefined
        ? dto.username.trim().toLowerCase()
        : undefined;

    if (username !== undefined) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username,

          id: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new ConflictException('Username sudah digunakan');
      }
    }

    const passwordHash =
      dto.password !== undefined ? await hash(dto.password, 12) : undefined;

    let selectedRoles:
      | Array<{
          id: number;
          name: string;
        }>
      | undefined;

   if (dto.roles !== undefined) {
     const roleNames = Array.from(new Set(dto.roles));

     selectedRoles = await this.prisma.role.findMany({
       where: {
         name: {
           in: roleNames,
         },
       },

       select: {
         id: true,
         name: true,
       },
     });

     if (selectedRoles.length !== roleNames.length) {
       throw new BadRequestException('Terdapat role yang tidak tersedia');
     }

     const currentlyAdmin = currentUser.roles.includes('ADMIN');

     const remainsAdmin = selectedRoles.some((role) => role.name === 'ADMIN');

     if (currentUser.isActive && currentlyAdmin && !remainsAdmin) {
       const activeAdminCount = await this.prisma.user.count({
         where: {
           isActive: true,

           roles: {
             some: {
               endedAt: null,

               role: {
                 name: 'ADMIN',
               },
             },
           },
         },
       });

       if (activeAdminCount <= 1) {
         throw new BadRequestException(
           'Role Admin terakhir tidak dapat dihapus',
         );
       }
     }
   }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: {
          id,
        },

        data: {
          ...(dto.name !== undefined && {
            name: dto.name.trim(),
          }),

          ...(username !== undefined && {
            username,
          }),

          ...(passwordHash !== undefined && {
            passwordHash,
          }),
        },
      });

      if (selectedRoles) {
        const selectedRoleIds = selectedRoles.map((role) => role.id);

        /*
         * Role yang tidak dipilih
         * diakhiri, bukan dihapus.
         */
        await transaction.userRole.updateMany({
          where: {
            userId: id,
            endedAt: null,

            roleId: {
              notIn: selectedRoleIds,
            },
          },

          data: {
            endedAt: new Date(),
          },
        });

        const activeRoles = await transaction.userRole.findMany({
          where: {
            userId: id,
            endedAt: null,

            roleId: {
              in: selectedRoleIds,
            },
          },

          select: {
            roleId: true,
          },
        });

        const activeRoleIds = new Set(
          activeRoles.map((userRole) => userRole.roleId),
        );

        const newRoleIds = selectedRoleIds.filter(
          (roleId) => !activeRoleIds.has(roleId),
        );

        if (newRoleIds.length > 0) {
          await transaction.userRole.createMany({
            data: newRoleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }
    });

    return this.findOne(id);
  }

  async updateStatus(id: number, isActive: boolean, currentUserId: number) {
    const user = await this.findOne(id);

    if (id === currentUserId && !isActive) {
      throw new BadRequestException(
        'Kamu tidak dapat menonaktifkan akun sendiri',
      );
    }

    if (user.roles.includes('ADMIN') && !isActive) {
      const activeAdmins = await this.prisma.user.count({
        where: {
          isActive: true,

          roles: {
            some: {
              endedAt: null,

              role: {
                name: 'ADMIN',
              },
            },
          },
        },
      });

      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Admin aktif terakhir tidak dapat dinonaktifkan',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },

      data: {
        isActive,
      },

      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      message: isActive
        ? 'Pengguna berhasil diaktifkan'
        : 'Pengguna berhasil dinonaktifkan',

      user: updatedUser,
    };
  }
}
