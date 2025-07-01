import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from '../../utils/supabaseClient';
import type { Account, JournalEntry, LedgerAccount as FrontendLedgerAccount } from '../../frontend/src/types';

type LedgerAccount = FrontendLedgerAccount;

export default async function handler(req: VercelRequest, res: VercelResponse, user_id: string) {
    try {
        const { data: accounts, error: accountsError } = await supabase.from('accounts').select('*').eq('user_id', user_id);
        if (accountsError) throw accountsError;

        const { startDate, endDate } = req.query;
        let journalEntriesQuery = supabase.from('journal_entries').select('*, entry_lines(*)').eq('user_id', user_id);

        if (startDate) {
            journalEntriesQuery = journalEntriesQuery.gte('entry_date', startDate as string);
        }
        if (endDate) {
            journalEntriesQuery = journalEntriesQuery.lte('entry_date', endDate as string);
        }

        const { data: journalEntriesData, error: journalEntriesError } = await journalEntriesQuery;
        if (journalEntriesError) throw journalEntriesError;

        const { data: products, error: productsError } = await supabase.from('products').select('*').eq('user_id', user_id);
        if (productsError) throw productsError;

        const journalEntries: JournalEntry[] = journalEntriesData.map(entry => ({
            ...entry,
            lines: entry.entry_lines.map((line: any) => ({
                account_id: line.account_id,
                type: line.debit > 0 ? 'debit' : 'credit',
                amount: line.debit > 0 ? line.debit : line.credit,
                debit: line.debit,
                credit: line.credit,
            }))
        }));

        const accountsMap = new Map<string, LedgerAccount>();
        accounts.forEach(account => {
            accountsMap.set(account.id, {
                account_id: account.id,
                accountName: account.name,
                type: account.type,
                debitEntries: [],
                creditEntries: [],
                totalDebits: 0,
                totalCredits: 0,
                debits: 0,
                credits: 0,
                finalBalance: 0,
            });
        });

        journalEntries.forEach(entry => {
            entry.lines.forEach(line => {
                const accountData = accountsMap.get(line.account_id);
                if (accountData) {
                    if (line.debit) {
                        accountData.totalDebits += line.debit;
                    }
                    if (line.credit) {
                        accountData.totalCredits += line.credit;
                    }
                }
            });
        });

        accountsMap.forEach(accountData => {
            const isDebitNature = ['asset', 'expense'].includes(accountData.type);
            accountData.finalBalance = isDebitNature ? (accountData.totalDebits - accountData.totalCredits) : (accountData.totalCredits - accountData.totalDebits);
        });

        const ledgerAccountsList = Array.from(accountsMap.values());
        
        // Simulação de cálculos de DRE e Balanço
        const dreData = { lucroLiquido: 1000 }; // Placeholder
        const balanceSheetData = { totalDoAtivo: 5000, totalPassivoEPatrimonioLiquido: 5000, isBalanced: true }; // Placeholder
        const stockBalances = [] as any[]; // Placeholder

        res.status(200).json({
            ledgerAccounts: ledgerAccountsList,
            trialBalanceData: ledgerAccountsList,
            dreData,
            balanceSheetData,
            stockBalances,
        });

    } catch (error: unknown) {
        console.error('Erro ao gerar relatórios:', error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        handleErrorResponse(res, 500, `Erro no servidor: ${message}`);
    }
}