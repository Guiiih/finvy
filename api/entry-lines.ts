import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import {
  idSchema,
  createEntryLineSchema,
  updateEntryLineSchema
} from './utils/schemas';
import { AuthApiError } from '@supabase/supabase-js'; 
import type { PostgrestError } from '@supabase/supabase-js'; 

export default async function (req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) {
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return handleErrorResponse(res, 401, 'Token de autenticação não fornecido.');
  }

  let user_id: string;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError?.message || 'Usuário não encontrado.');
      if (authError && authError instanceof AuthApiError) {
        return handleErrorResponse(res, 401, `Falha na autenticação: ${authError.message}`);
      }
      return handleErrorResponse(res, 401, 'Token de autenticação inválido ou expirado.');
    }
    user_id = user.id;
  } catch (error: unknown) { 
    console.error('Erro ao verificar token (capturado):', error);
    let message = 'Erro interno ao verificar autenticação.';
    if (error instanceof Error) {
        message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }

  try {
    if (req.method === 'GET') {
      const { journal_entry_id } = req.query;

      if (journal_entry_id) {
        // This is the new route: /api/journal-entries/:journal_entry_id/lines
        const { data, error: dbError } = await supabase
          .from('entry_lines')
          .select('*, product_id, quantity, unit_cost')
          .eq('journal_entry_id', journal_entry_id as string);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      } else {
        // This is the old route: /api/entry-lines
        const { data, error: dbError } = await supabase
          .from('entry_lines')
          .select('*, journal_entry_id(user_id)')
          .eq('journal_entry_id.user_id', user_id);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      }
    } else if (req.method === 'POST') {
      const parsedBody = createEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const { journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, total_net } = parsedBody.data;

      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .select('id, user_id')
        .eq('id', journal_entry_id)
        .eq('user_id', user_id)
        .single();

      if (journalError) throw journalError;
      if (!journalEntry) {
        return handleErrorResponse(res, 403, 'Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.');
      }

      const { data: newLine, error: insertError } = await supabase
        .from('entry_lines')
        .insert([{ journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, total_net }])
        .select()
        .maybeSingle();

      if (insertError) {
        console.error(`Erro ao inserir nova linha de lançamento: ${insertError.message}`);
        throw insertError;
      }
      if (!newLine) {
        return handleErrorResponse(res, 500, 'Erro ao criar linha de lançamento: nenhum dado retornado.');
      }

      if (insertError) throw insertError;

      if (newLine.product_id && newLine.quantity && newLine.unit_cost) {
        const { data: product, error: productFetchError } = await supabase
          .from('products')
          .select('current_stock, user_id')
          .eq('id', newLine.product_id)
          .eq('user_id', user_id)
          .maybeSingle();

        console.log(`Attempting to fetch product with ID: ${newLine.product_id} for User ID: ${user_id}`);
        if (productFetchError) {
          console.error(`Error fetching product: ${productFetchError.message}`);
          throw productFetchError;
        }
        if (!product) {
          console.warn(`Produto ${newLine.product_id} não encontrado ou sem permissão para atualizar estoque.`);
          return res.status(404).json({ error: `Produto ${newLine.product_id} não encontrado ou sem permissão para atualizar estoque.` });
        }

        if (productFetchError) throw productFetchError;
        if (!product) {
          console.warn(`Produto ${newLine.product_id} não encontrado ou sem permissão para atualizar estoque.`);
        } else {
          let newStock = product.current_stock || 0;
          const isPurchase = (newLine.debit && newLine.debit > 0);

          if (isPurchase) {
            newStock += newLine.quantity;
          } else {
            newStock -= newLine.quantity;
          }

          const { error: updateProductError } = await supabase
            .from('products')
            .update({ current_stock: newStock })
            .eq('id', newLine.product_id)
            .eq('user_id', user_id);

          if (updateProductError) throw updateProductError;
        }
      }

      return res.status(201).json(newLine);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      console.log(`PUT: Buscando linha de lançamento com ID: ${id} para user_id: ${user_id}`);
      const { data: entryLine, error: fetchError } = await supabase
        .from('entry_lines')
        .select('journal_entry_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error(`PUT: Erro ao buscar linha de lançamento para atualização: ${fetchError.message}`);
        throw fetchError;
      }
      if (!entryLine) {
        console.warn(`PUT: Linha de lançamento com ID ${id} não encontrada.`);
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada.');
      }

      console.log(`PUT: Buscando lançamento diário com ID: ${entryLine.journal_entry_id} para user_id: ${user_id}`);
      console.log(`PUT: Buscando lançamento diário com ID: ${entryLine.journal_entry_id} para user_id: ${user_id}`);
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .select('id, user_id')
        .eq('id', entryLine.journal_entry_id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (journalError) {
        console.error(`PUT: Erro ao buscar lançamento diário para atualização: ${journalError.message}`);
        throw journalError;
      }
      if (!journalEntry) {
        console.warn(`PUT: Lançamento diário com ID ${entryLine.journal_entry_id} não encontrado ou sem permissão.`);
        return handleErrorResponse(res, 403, 'Você não tem permissão para atualizar esta linha de lançamento.');
      }

      if (journalError) throw journalError;
      if (!journalEntry) {
        return handleErrorResponse(res, 403, 'Você não tem permissão para atualizar esta linha de lançamento.');
      }

      const { data, error: dbError } = await supabase
        .from('entry_lines')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (dbError) {
        console.error(`Erro ao atualizar linha de lançamento: ${dbError.message}`);
        throw dbError;
      }
      if (!data) {
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada ou não autorizada para atualização.');
      }

      if (dbError) throw dbError;

      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const { id, journal_entry_id } = req.query;

      let linesToDelete: { id: string, product_id?: string, quantity?: number, unit_cost?: number, debit?: number, credit?: number }[] = [];

      if (id) {
        const parsedId = idSchema.safeParse({ id });
        if (!parsedId.success) {
          return handleErrorResponse(res, 400, parsedId.error.errors.map(err => err.message).join(', '));
        }

        console.log(`DELETE: Buscando linha de lançamento com ID: ${parsedId.data.id} para user_id: ${user_id}`);
        const { data: entryLine, error: fetchError } = await supabase
          .from('entry_lines')
          .select('id, journal_entry_id, product_id, quantity, unit_cost, debit, credit')
          .eq('id', parsedId.data.id)
          .maybeSingle();

        if (fetchError) {
          console.error(`DELETE: Erro ao buscar linha de lançamento para exclusão: ${fetchError.message}`);
          throw fetchError;
        }
        if (!entryLine) {
          console.warn(`DELETE: Linha de lançamento com ID ${parsedId.data.id} não encontrada.`);
          return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada.');
        }

        console.log(`DELETE: Buscando lançamento diário com ID: ${entryLine.journal_entry_id} para user_id: ${user_id}`);
        const { data: journalEntry, error: journalError } = await supabase
          .from('journal_entries')
          .select('id, user_id')
          .eq('id', entryLine.journal_entry_id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (journalError) {
          console.error(`DELETE: Erro ao buscar lançamento diário para exclusão (primeiro bloco): ${journalError.message}`);
          throw journalError;
        }
        if (!journalEntry) {
          console.warn(`DELETE: Lançamento diário com ID ${entryLine.journal_entry_id} não encontrado ou sem permissão.`);
          return handleErrorResponse(res, 403, 'Você não tem permissão para deletar esta linha de lançamento.');
        }
        linesToDelete.push(entryLine);
      } else if (journal_entry_id) {
        const parsedId = idSchema.safeParse({ id: journal_entry_id });
        if (!parsedId.success) {
          return handleErrorResponse(res, 400, parsedId.error.errors.map(err => err.message).join(', '));
        }

        console.log(`DELETE: Buscando lançamento diário com ID: ${parsedId.data.id} para user_id: ${user_id}`);
        const { data: journalEntry, error: journalError } = await supabase
          .from('journal_entries')
          .select('id, user_id')
          .eq('id', parsedId.data.id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (journalError) {
          console.error(`DELETE: Erro ao buscar lançamento diário para exclusão (segundo bloco): ${journalError.message}`);
          throw journalError;
        }
        if (!journalEntry) {
          console.warn(`DELETE: Lançamento diário com ID ${parsedId.data.id} não encontrado ou sem permissão.`);
          return handleErrorResponse(res, 403, 'Você não tem permissão para deletar linhas deste lançamento diário.');
        }

        const { data: lines, error: fetchLinesError } = await supabase
          .from('entry_lines')
          .select('id, product_id, quantity, unit_cost, debit, credit')
          .eq('journal_entry_id', parsedId.data.id);

        if (fetchLinesError) throw fetchLinesError;
        linesToDelete = lines || [];
      } else {
        return handleErrorResponse(res, 400, 'ID da linha ou ID do lançamento diário é obrigatório para exclusão.');
      }

      for (const line of linesToDelete) {
        if (line.product_id && line.quantity && line.unit_cost) {
          const { data: product, error: productFetchError } = await supabase
            .from('products')
            .select('current_stock, user_id')
            .eq('id', line.product_id)
            .eq('user_id', user_id)
            .maybeSingle();

          console.log(`Attempting to fetch product for deletion with ID: ${line.product_id} for User ID: ${user_id}`);
          if (productFetchError) {
            console.error(`Error fetching product for deletion: ${productFetchError.message}`);
            throw productFetchError;
          }
          if (!product) {
            console.warn(`Produto ${line.product_id} não encontrado ou sem permissão para reverter estoque.`);
            continue;
          }

          if (productFetchError) throw productFetchError;
          if (!product) {
            console.warn(`Produto ${line.product_id} não encontrado ou sem permissão para reverter estoque.`);
            continue;
          }

          let newStock = product.current_stock || 0;
          const isPurchase = (line.debit && line.debit > 0);

          if (isPurchase) {
            newStock -= line.quantity;
          } else {
            newStock += line.quantity;
          }

          const { error: updateProductError } = await supabase
            .from('products')
            .update({ current_stock: newStock })
            .eq('id', line.product_id)
            .eq('user_id', user_id);

          if (updateProductError) throw updateProductError;
        }
      }

      if (id) {
        const { error: dbError, count } = await supabase
          .from('entry_lines')
          .delete()
          .eq('id', id);

        if (dbError) throw dbError;
        if (count === 0) return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada ou não autorizada para exclusão.');
      } else if (journal_entry_id) {
        const { error: dbError, count } = await supabase
          .from('entry_lines')
          .delete()
          .eq('journal_entry_id', journal_entry_id);

        if (dbError) throw dbError;
      }
      
      return res.status(204).end();

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }

  } catch (error: unknown) { 
    console.error('Erro inesperado na API de linhas de lançamento:', error);
    let message = 'Erro interno do servidor.';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message; 
    }
    return handleErrorResponse(res, 500, message);
  }
}