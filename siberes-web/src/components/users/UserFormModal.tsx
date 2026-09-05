'use client';

import {
  Alert,
  Button,
  Group,
  Modal,
  MultiSelect,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

import { createUser, updateUser } from '@/lib/api/users';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserRole,
} from '@/types/user';

interface UserFormValues {
  name: string;
  username: string;
  password: string;
  roles: UserRole[];
}

interface UserFormModalProps {
  opened: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const ROLE_OPTIONS = [
  {
    value: 'ADMIN',
    label: 'Admin',
  },
  {
    value: 'KETUA_BRS',
    label: 'Ketua BRS',
  },
  {
    value: 'PENGELOLA',
    label: 'Pengelola',
  },
];

export function UserFormModal({
  opened,
  user,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = user !== null && user !== undefined;

  const form = useForm<UserFormValues>({
    initialValues: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      password: '',
      roles: user?.roles ?? [],
    },

    validate: {
      name: (value) =>
        value.trim().length === 0
          ? 'Nama wajib diisi'
          : null,

      username: (value) => {
        if (value.trim().length === 0) {
          return 'Username wajib diisi';
        }

        if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          return 'Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung';
        }

        return null;
      },

      password: (value) => {
        if (isEditing && value.length === 0) {
          return null;
        }

        return value.length < 8
          ? 'Password minimal 8 karakter'
          : null;
      },

      roles: (value) =>
        value.length === 0
          ? 'Pilih minimal satu role'
          : null,
    },
  });

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    onClose();
  }

  async function handleSubmit(values: UserFormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      let savedUser: User;

      if (isEditing) {
        const payload: UpdateUserPayload = {
          name: values.name.trim(),
          username: values.username.trim(),
          roles: values.roles,
        };

        /*
         * Password hanya dikirim jika Admin
         * benar-benar mengisinya.
         */
        if (values.password.length > 0) {
          payload.password = values.password;
        }

        savedUser = await updateUser(user.id, payload);
      } else {
        const payload: CreateUserPayload = {
          name: values.name.trim(),
          username: values.username.trim(),
          password: values.password,
          roles: values.roles,
        };

        savedUser = await createUser(payload);
      }

      onSaved(savedUser);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menyimpan pengguna'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        isEditing ? 'Edit Pengguna' : 'Tambah Pengguna'
      }
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form
        onSubmit={form.onSubmit((values) => {
          void handleSubmit(values);
        })}
      >
        <Stack>
          {error && (
            <Alert color="red" title="Gagal">
              {error}
            </Alert>
          )}

          <TextInput
            label="Nama"
            placeholder="Nama lengkap pengguna"
            required
            disabled={isSubmitting}
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Username"
            placeholder="Contoh: ketua.brs"
            required
            disabled={isSubmitting}
            {...form.getInputProps('username')}
          />

          <PasswordInput
            label={isEditing ? 'Password baru' : 'Password'}
            description={
              isEditing
                ? 'Kosongkan jika password tidak diubah'
                : undefined
            }
            placeholder={
              isEditing
                ? 'Tidak perlu diisi'
                : 'Minimal 8 karakter'
            }
            required={!isEditing}
            disabled={isSubmitting}
            {...form.getInputProps('password')}
          />

          <MultiSelect
            label="Role"
            placeholder="Pilih role pengguna"
            data={ROLE_OPTIONS}
            required
            clearable
            disabled={isSubmitting}
            {...form.getInputProps('roles')}
            onChange={(roles) => {
              form.setFieldValue(
                'roles',
                roles as UserRole[]
              );
            }}
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>

            <Button type="submit" loading={isSubmitting}>
              {isEditing
                ? 'Simpan Perubahan'
                : 'Tambah Pengguna'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
