import { Injectable } from '@angular/core';
import { User } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private baseService: BaseService) {}

  async getUsers(params?: any): Promise<{ data: User[]; total: number }> {
    const res = await this.baseService.getData('users', params);
    if (res && res.success === true && res.data) {
      const data = res.data || [];
      return { data, total: data.length };
    }
    return { data: [], total: 0 };
  }

  async getUserById(id: number): Promise<User | null> {
    const res = await this.baseService.getData(`users/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createUser(data: { username: string; password: string; fullName?: string; status?: number; roleIds: number[] }): Promise<User | null> {
    const res = await this.baseService.postData('users', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateUser(id: number, data: { fullName?: string; status?: number; roleIds?: number[] }): Promise<User | null> {
    const res = await this.baseService.putData(`users/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateUserRoles(id: number, roleIds: number[]): Promise<User | null> {
    const res = await this.baseService.putData(`users/${id}/roles`, { roleIds });
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`users/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

