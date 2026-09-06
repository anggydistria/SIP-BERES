import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    const secretKey = this.configService.get<string>('SUPABASE_SECRET_KEY');

    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET');

    if (!supabaseUrl || !secretKey || !bucket) {
      throw new Error('Konfigurasi Supabase Storage belum lengkap');
    }

    this.bucket = bucket;

    this.supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const normalizedPath = this.normalizePath(path);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(normalizedPath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `File gagal disimpan: ${error.message}`,
      );
    }

    return normalizedPath;
  }

  async download(path: string): Promise<Buffer> {
    const normalizedPath = this.normalizePath(path);

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(normalizedPath);

    if (error || !data) {
      throw new InternalServerErrorException(
        `File gagal diunduh: ${error?.message ?? 'File tidak ditemukan'}`,
      );
    }

    const arrayBuffer = await data.arrayBuffer();

    return Buffer.from(arrayBuffer);
  }

  async remove(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([normalizedPath]);

    if (error) {
      throw new InternalServerErrorException(
        `File gagal dihapus: ${error.message}`,
      );
    }
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    const normalizedSource = this.normalizePath(sourcePath);

    const normalizedDestination = this.normalizePath(destinationPath);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .move(normalizedSource, normalizedDestination);

    if (error) {
      throw new InternalServerErrorException(
        `File gagal dipindahkan: ${error.message}`,
      );
    }
  }

  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '');
  }
}
