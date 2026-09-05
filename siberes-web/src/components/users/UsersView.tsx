'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';

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

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Kelola Pengguna</Title>

          <Text c="dimmed" size="sm">
            Tambah, ubah, dan atur status pengguna SIBERES.
          </Text>
        </div>

        <Button onClick={handleOpenCreate}>
          Tambah Pengguna
        </Button>
      </Group>

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
        ) : users.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Belum ada data pengguna.
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
                {users.map((item) => {
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
