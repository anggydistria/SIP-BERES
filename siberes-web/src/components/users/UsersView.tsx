'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconShieldCheck,
  IconUserCheck,
  IconUserOff,
  IconUserPlus,
  IconUsers,
  IconAdjustments,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  getUsers,
  updateUserStatus,
} from '@/lib/api/users';
import type { User } from '@/types/user';
import { useDisclosure } from '@mantine/hooks';

import { UserFormModal } from './UserFormModal';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function UsersView() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const isAdmin =
    currentUser?.roles.includes('ADMIN') ?? false;

  const [
    userFormOpened,
    { open: openUserForm, close: closeUserForm },
  ] = useDisclosure(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    string | null
  >(null);
  const [statusFilter, setStatusFilter] = useState<
    string | null
  >(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
 useEffect(() => {
   if (!isAdmin) {
     return;
   }

   let isCancelled = false;

   getUsers()
     .then((result) => {
       if (!isCancelled) {
         setUsers(result);
         setError(null);
       }
     })
     .catch((caughtError: unknown) => {
       if (!isCancelled) {
         setError(
           caughtError instanceof Error
             ? caughtError.message
             : 'Gagal mengambil daftar pengguna'
         );
       }
     })
     .finally(() => {
       if (!isCancelled) {
         setIsLoading(false);
       }
     });

   return () => {
     isCancelled = true;
   };
 }, [isAdmin]);

 const filteredUsers = useMemo(() => {
   const normalizedSearch = search.trim().toLowerCase();

   return users.filter((item) => {
     const matchesSearch =
       normalizedSearch.length === 0 ||
       item.name.toLowerCase().includes(normalizedSearch) ||
       item.username
         .toLowerCase()
         .includes(normalizedSearch);

     const matchesRole =
       roleFilter === null ||
       item.roles.includes(
         roleFilter as User['roles'][number]
       );

     const matchesStatus =
       statusFilter === null ||
       (statusFilter === 'ACTIVE' && item.isActive) ||
       (statusFilter === 'INACTIVE' && !item.isActive);

     return matchesSearch && matchesRole && matchesStatus;
   });
 }, [users, search, roleFilter, statusFilter]);

 const numericPageSize = Number(pageSize);

 const totalPages = Math.max(
   1,
   Math.ceil(filteredUsers.length / numericPageSize)
 );

 const currentPage = Math.min(page, totalPages);

 const firstIndex = (currentPage - 1) * numericPageSize;

 const visibleUsers = filteredUsers.slice(
   firstIndex,
   firstIndex + numericPageSize
 );

 function handleResetFilter() {
   setSearch('');
   setRoleFilter(null);
   setStatusFilter(null);
   setPage(1);
 }
  function handleUserSaved(savedUser: User) {
    const isEditing = selectedUser !== null;

    setUsers((currentUsers) => {
      const userExists = currentUsers.some(
        (item) => item.id === savedUser.id
      );

      const nextUsers = userExists
        ? currentUsers.map((item) =>
            item.id === savedUser.id ? savedUser : item
          )
        : [...currentUsers, savedUser];

      return nextUsers.sort((first, second) =>
        first.name.localeCompare(second.name, 'id')
      );
    });

    setError(null);

    setSuccessMessage(
      isEditing
        ? `Pengguna ${savedUser.name} berhasil diperbarui`
        : `Pengguna ${savedUser.name} berhasil ditambahkan`
    );
  }

  function handleOpenCreate() {
    setSelectedUser(null);
    openUserForm();
  }

  function handleOpenEdit(user: User) {
    setSelectedUser(user);
    openUserForm();
  }

  function handleCloseUserForm() {
    closeUserForm();
    setSelectedUser(null);
  }

  async function handleStatusChange(targetUser: User) {
    const nextStatus = !targetUser.isActive;

    const confirmed = window.confirm(
      nextStatus
        ? `Aktifkan kembali pengguna ${targetUser.name}?`
        : `Nonaktifkan pengguna ${targetUser.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingUserId(targetUser.id);
      setError(null);
      setSuccessMessage(null);

      const result = await updateUserStatus(
        targetUser.id,
        nextStatus
      );

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === targetUser.id
            ? {
                ...item,
                isActive: result.user.isActive,
                updatedAt: result.user.updatedAt,
              }
            : item
        )
      );

      setSuccessMessage(result.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengubah status pengguna'
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  const activeUsers = users.filter(
    (item) => item.isActive
  ).length;

  const inactiveUsers = users.filter(
    (item) => !item.isActive
  ).length;

  const activeAdmins = users.filter(
    (item) => item.isActive && item.roles.includes('ADMIN')
  ).length;
  return (
    <Stack gap="lg">
      <Paper
        withBorder
        p={{
          base: 'md',
          sm: 'lg',
        }}
        shadow="xs"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-bpsBlue-0), var(--mantine-color-bpsGreen-0))',
          borderColor: 'var(--mantine-color-bpsBlue-2)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Group align="flex-start" wrap="nowrap">
            <ThemeIcon
              size={54}
              radius="md"
              variant="gradient"
              gradient={{
                from: 'bpsBlue.6',
                to: 'bpsGreen.6',
                deg: 135,
              }}
            >
              <IconUsers size={30} stroke={1.8} />
            </ThemeIcon>

            <div>
              <Title order={2}>Kelola Pengguna</Title>

              <Text c="dimmed" size="sm" mt={2}>
                Tambah, ubah, dan atur hak akses pengguna
                SIBERES.
              </Text>
            </div>
          </Group>

          <Button
            color="bpsBlue"
            leftSection={<IconUserPlus size={18} />}
            onClick={handleOpenCreate}
          >
            Tambah Pengguna
          </Button>
        </Group>
      </Paper>

      <SimpleGrid
        cols={{
          base: 1,
          xs: 2,
          lg: 4,
        }}
      >
        <UserSummaryCard
          icon={<IconUsers size={24} />}
          color="bpsBlue"
          label="Total Pengguna"
          value={isLoading ? '–' : String(users.length)}
        />

        <UserSummaryCard
          icon={<IconUserCheck size={24} />}
          color="bpsGreen"
          label="Pengguna Aktif"
          value={isLoading ? '–' : String(activeUsers)}
        />

        <UserSummaryCard
          icon={<IconUserOff size={24} />}
          color="bpsOrange"
          label="Pengguna Nonaktif"
          value={isLoading ? '–' : String(inactiveUsers)}
        />

        <UserSummaryCard
          icon={<IconShieldCheck size={24} />}
          color="bpsBlue"
          label="Admin Aktif"
          value={isLoading ? '–' : String(activeAdmins)}
        />
      </SimpleGrid>
      <Paper withBorder p="md" shadow="xs">
        <Group mb="md">
          <ThemeIcon
            color="bpsBlue"
            variant="light"
            size={38}
          >
            <IconAdjustments size={21} />
          </ThemeIcon>

          <div>
            <Text fw={650}>Filter Pengguna</Text>

            <Text size="xs" c="dimmed">
              Cari pengguna berdasarkan identitas, role, dan
              status.
            </Text>
          </div>
        </Group>

        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
            lg: 4,
          }}
          style={{
            alignItems: 'end',
          }}
        >
          <TextInput
            label="Pencarian"
            placeholder="Nama atau username"
            value={search}
            leftSection={<IconSearch size={17} />}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPage(1);
            }}
          />

          <Select
            label="Role"
            placeholder="Semua role"
            value={roleFilter}
            data={[
              {
                value: 'ADMIN',
                label: 'Administrator',
              },
              {
                value: 'KETUA_BRS',
                label: 'Ketua BRS',
              },
              {
                value: 'PENGELOLA',
                label: 'Pengelola',
              },
            ]}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            clearable
          />

          <Select
            label="Status"
            placeholder="Semua status"
            value={statusFilter}
            data={[
              {
                value: 'ACTIVE',
                label: 'Aktif',
              },
              {
                value: 'INACTIVE',
                label: 'Nonaktif',
              },
            ]}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            clearable
          />

          <Button
            variant="light"
            color="gray"
            leftSection={<IconRefresh size={18} />}
            onClick={handleResetFilter}
          >
            Reset Filter
          </Button>
        </SimpleGrid>
      </Paper>
      {error && (
        <Alert
          color="red"
          title="Terjadi kesalahan"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          color="green"
          title="Berhasil"
          withCloseButton
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : filteredUsers.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {users.length === 0
              ? 'Belum ada data pengguna.'
              : 'Pengguna tidak ditemukan berdasarkan filter.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nama</Table.Th>
                  <Table.Th>Username</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Dibuat</Table.Th>
                  <Table.Th>Aksi</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {visibleUsers.map((item) => {
                  const isCurrentUser =
                    item.id === currentUser?.id;

                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text fw={500}>{item.name}</Text>

                          {isCurrentUser && (
                            <Text size="xs" c="dimmed">
                              Akun kamu
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>

                      <Table.Td>{item.username}</Table.Td>

                      <Table.Td>
                        <Group gap="xs">
                          {item.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="light"
                            >
                              {role.replaceAll('_', ' ')}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        <Badge
                          color={
                            item.isActive ? 'green' : 'gray'
                          }
                        >
                          {item.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        {formatDate(item.createdAt)}
                      </Table.Td>

                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => {
                              handleOpenEdit(item);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="xs"
                            variant="light"
                            color={
                              item.isActive
                                ? 'red'
                                : 'green'
                            }
                            disabled={isCurrentUser}
                            loading={
                              processingUserId === item.id
                            }
                            onClick={() => {
                              void handleStatusChange(item);
                            }}
                          >
                            {item.isActive
                              ? 'Nonaktifkan'
                              : 'Aktifkan'}
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
      <UsersPagination
        total={filteredUsers.length}
        displayedRows={visibleUsers.length}
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        loading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />
      {userFormOpened && (
        <UserFormModal
          opened={userFormOpened}
          user={selectedUser}
          onClose={handleCloseUserForm}
          onSaved={handleUserSaved}
        />
      )}
    </Stack>
  );
}

interface UserSummaryCardProps {
  icon: React.ReactNode;
  color: 'bpsBlue' | 'bpsGreen' | 'bpsOrange';
  label: string;
  value: string;
}

function UserSummaryCard({
  icon,
  color,
  label,
  value,
}: UserSummaryCardProps) {
  return (
    <Paper
      withBorder
      p="lg"
      shadow="xs"
      h="100%"
      style={{
        borderTop: `4px solid var(--mantine-color-${color}-6)`,
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed">
            {label}
          </Text>

          <Text fw={750} fz={30} mt={4}>
            {value}
          </Text>
        </div>

        <ThemeIcon
          color={color}
          variant="light"
          size={46}
          radius="md"
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

interface UsersPaginationProps {
  total: number;
  displayedRows: number;
  page: number;
  totalPages: number;
  pageSize: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: string) => void;
}

function UsersPagination({
  total,
  displayedRows,
  page,
  totalPages,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: UsersPaginationProps) {
  if (total === 0) {
    return null;
  }

  const numericPageSize = Number(pageSize);
  const firstRow = (page - 1) * numericPageSize + 1;
  const lastRow = firstRow + displayedRows - 1;

  return (
    <Paper withBorder p="sm" shadow="xs">
      <Group justify="space-between">
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Tampilkan
          </Text>

          <Select
            value={pageSize}
            data={[
              { value: '10', label: '10' },
              { value: '25', label: '25' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
            onChange={(value) => {
              onPageSizeChange(value ?? '10');
            }}
            allowDeselect={false}
            disabled={loading}
            w={80}
          />

          <Text size="sm" c="dimmed">
            data
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          Menampilkan {firstRow}–{lastRow} dari {total}{' '}
          pengguna
        </Text>

        <Pagination
          value={page}
          total={totalPages}
          onChange={onPageChange}
          disabled={loading}
          color="bpsBlue"
          withEdges
        />
      </Group>
    </Paper>
  );
}
