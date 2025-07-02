import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAccountStore } from './accountStore';
import { api } from '@/services/api'; // Importa o serviço real para mockar
import type { Account } from '@/types';

// Mock do serviço de API
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('accountStore', () => {
  let store: ReturnType<typeof useAccountStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountStore();
    // Limpa os mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('deve buscar contas com sucesso', async () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'Conta Teste 1', type: 'asset', code: 1 },
      { id: '2', name: 'Conta Teste 2', type: 'liability', code: 2 },
    ];
    (api.get as vi.Mock).mockResolvedValue(mockAccounts);

    await store.fetchAccounts();

    expect(store.accounts).toEqual(mockAccounts);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/accounts');
  });

  it('deve lidar com erro ao buscar contas', async () => {
    const errorMessage = 'Erro de rede';
    (api.get as vi.Mock).mockRejectedValue(new Error(errorMessage));

    await store.fetchAccounts();

    expect(store.accounts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(errorMessage);
  });

  it('deve adicionar uma nova conta com sucesso', async () => {
    const newAccountData = { name: 'Nova Conta', type: 'revenue' };
    const addedAccount: Account = { id: '3', code: 3, ...newAccountData };
    (api.post as vi.Mock).mockResolvedValue(addedAccount);

    const result = await store.addAccount(newAccountData);

    expect(store.accounts).toContainEqual(addedAccount);
    expect(result).toEqual(addedAccount);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/accounts', newAccountData);
  });

  it('deve lidar com erro ao adicionar conta', async () => {
    const errorMessage = 'Falha ao criar';
    (api.post as vi.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(store.addAccount({ name: 'Conta Falha', type: 'expense' })).rejects.toThrow(errorMessage);
    expect(store.accounts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(errorMessage);
  });

  it('deve atualizar uma conta existente com sucesso', async () => {
    const initialAccount: Account = { id: '1', name: 'Conta Antiga', type: 'asset', code: 1 };
    store.accounts = [initialAccount];

    const updatedFields = { name: 'Conta Atualizada' };
    const updatedAccount: Account = { ...initialAccount, ...updatedFields };
    (api.put as vi.Mock).mockResolvedValue(updatedAccount);

    const result = await store.updateAccount('1', updatedFields);

    expect(store.accounts).toContainEqual(updatedAccount);
    expect(result).toEqual(updatedAccount);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(api.put).toHaveBeenCalledWith('/accounts/1', updatedFields);
  });

  it('deve lidar com erro ao atualizar conta', async () => {
    const initialAccount: Account = { id: '1', name: 'Conta Antiga', type: 'asset', code: 1 };
    store.accounts = [initialAccount];

    const errorMessage = 'Falha ao atualizar';
    (api.put as vi.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(store.updateAccount('1', { name: 'Erro' })).rejects.toThrow(errorMessage);
    expect(store.accounts).toContainEqual(initialAccount); // A conta não deve ser alterada
    expect(store.loading).toBe(false);
    expect(store.error).toBe(errorMessage);
  });

  it('deve deletar uma conta com sucesso', async () => {
    const accountToDelete: Account = { id: '1', name: 'Conta a Deletar', type: 'asset', code: 1 };
    store.accounts = [accountToDelete];

    (api.delete as vi.Mock).mockResolvedValue(null);

    await store.deleteAccount('1');

    expect(store.accounts).not.toContainEqual(accountToDelete);
    expect(store.accounts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(api.delete).toHaveBeenCalledWith('/accounts/1');
  });

  it('deve lidar com erro ao deletar conta', async () => {
    const accountToDelete: Account = { id: '1', name: 'Conta a Deletar', type: 'asset', code: 1 };
    store.accounts = [accountToDelete];

    const errorMessage = 'Falha ao deletar';
    (api.delete as vi.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(store.deleteAccount('1')).rejects.toThrow(errorMessage);
    expect(store.accounts).toContainEqual(accountToDelete); // A conta não deve ser deletada
    expect(store.loading).toBe(false);
    expect(store.error).toBe(errorMessage);
  });

  it('getAllAccounts deve retornar todas as contas', () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'A', type: 'asset', code: 1 },
      { id: '2', name: 'B', type: 'liability', code: 2 },
    ];
    store.accounts = mockAccounts;
    expect(store.getAllAccounts).toEqual(mockAccounts);
  });

  it('getAccountById deve retornar a conta correta', () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'A', type: 'asset', code: 1 },
      { id: '2', name: 'B', type: 'liability', code: 2 },
    ];
    store.accounts = mockAccounts;
    expect(store.getAccountById('1')).toEqual(mockAccounts[0]);
    expect(store.getAccountById('99')).toBeUndefined();
  });

  it('getAccountByName deve retornar a conta correta', () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'Conta A', type: 'asset', code: 1 },
      { id: '2', name: 'Conta B', type: 'liability', code: 2 },
    ];
    store.accounts = mockAccounts;
    expect(store.getAccountByName('Conta A')).toEqual(mockAccounts[0]);
    expect(store.getAccountByName('Conta C')).toBeUndefined();
  });

  it('accountTypes deve retornar tipos únicos de contas', () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'A', type: 'asset', code: 1 },
      { id: '2', name: 'B', type: 'liability', code: 2 },
      { id: '3', name: 'C', type: 'asset', code: 3 },
    ];
    store.accounts = mockAccounts;
    expect(store.accountTypes).toEqual(['asset', 'liability']);
  });

  it('getAccountsByType deve retornar contas do tipo correto', () => {
    const mockAccounts: Account[] = [
      { id: '1', name: 'A', type: 'asset', code: 1 },
      { id: '2', name: 'B', type: 'liability', code: 2 },
      { id: '3', name: 'C', type: 'asset', code: 3 },
    ];
    store.accounts = mockAccounts;
    expect(store.getAccountsByType('asset')).toEqual([mockAccounts[0], mockAccounts[2]]);
    expect(store.getAccountsByType('equity')).toEqual([]);
  });
});
