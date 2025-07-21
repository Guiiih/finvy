
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../handlers/nfe-import';
import { getSupabaseClient, handleErrorResponse, getUserOrganizationAndPeriod } from '../utils/supabaseClient';
import { formatSupabaseError } from '../utils/errorUtils';
import logger from '../utils/logger';
import { parseStringPromise } from 'xml2js';

// Mocks
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
  handleErrorResponse: vi.fn(),
  getUserOrganizationAndPeriod: vi.fn(),
}));
vi.mock('../utils/errorUtils', () => ({
  formatSupabaseError: vi.fn(),
}));
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('xml2js', () => ({
  parseStringPromise: vi.fn(),
}));

describe('NFe Import Handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockReq: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockRes: any = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
  };
  const mockUserId = 'test-user-id';
  const mockToken = 'test-token';

  // Helper function to create a full mock NFe structure that mimics xml2js output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockParsedNFe = (overrides: any = {}) => {
    const defaultData = {
      nfeProc: {
        NFe: {
          infNFe: {
            Id: 'NFe123',
            ide: { dhEmi: '2025-01-01', tpNF: '0' },
            emit: {
              CNPJ: '12345678901234',
              xNome: 'Emitente Teste',
              enderEmit: { UF: 'SP', xMun: 'Sao Paulo' },
            },
            dest: {
              CNPJ: '98765432109876',
              xNome: 'Destinatario Teste',
              enderDest: { UF: 'RJ', xMun: 'Rio de Janeiro' },
            },
            total: {
              ICMSTot: {
                vProd: '100.00',
                vNF: '120.00',
                vICMS: '18.00',
                vIPI: '2.00',
                vPIS: '0.65',
                vCOFINS: '3.00',
              },
            },
            det: {
              prod: {
                xProd: 'Produto A',
                NCM: '12345678',
                qCom: '1',
                vUnCom: '100.00',
                vProd: '100.00',
              },
              imposto: {
                ICMS: { ICMS: { vICMS: '18.00' } },
                IPI: { IPITrib: { vIPI: '2.00' } },
                PIS: { PISAliq: { vPIS: '0.65' } },
                COFINS: { COFINSAliq: { vCOFINS: '3.00' } },
              },
            },
          },
        },
      },
    };

    // Basic deep merge for relevant parts
    if (overrides.ide) {
      defaultData.nfeProc.NFe.infNFe.ide = { ...defaultData.nfeProc.NFe.infNFe.ide, ...overrides.ide };
    }
    if (overrides.total?.ICMSTot) {
      defaultData.nfeProc.NFe.infNFe.total.ICMSTot = { ...defaultData.nfeProc.NFe.infNFe.total.ICMSTot, ...overrides.total.ICMSTot };
    }
    if (overrides.det) {
        defaultData.nfeProc.NFe.infNFe.det = { ...defaultData.nfeProc.NFe.infNFe.det, ...overrides.det };
    }


    return defaultData;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (handleErrorResponse as vi.Mock).mockImplementation((res, status, message) => {
      return res.status(status).json({ error: message });
    });
  });

  it('should return 405 if method is not POST', async () => {
    mockReq.method = 'GET';
    await handler(mockReq, mockRes, mockUserId, mockToken);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 405, 'Method GET Not Allowed');
  });

  it('should return 403 if organization or accounting period not found', async () => {
    mockReq.method = 'POST';
    mockReq.body = '<xml></xml>';
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce(null);

    await handler(mockReq, mockRes, mockUserId, mockToken);
    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 403, 'Organização ou período contábil não encontrado para o usuário.');
  });

  it('should return 400 if request body is invalid', async () => {
    mockReq.method = 'POST';
    mockReq.body = null;
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({ organization_id: 'org1' });

    await handler(mockReq, mockRes, mockUserId, mockToken);
    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Corpo da requisição inválido. Esperado XML como string.');
  });

  it('should return 400 if XML parsing fails', async () => {
    mockReq.method = 'POST';
    mockReq.body = '<invalid-xml>';
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({ organization_id: 'org1' });
    (parseStringPromise as vi.Mock).mockRejectedValueOnce(new Error('Parsing error'));

    await handler(mockReq, mockRes, mockUserId, mockToken);
    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Erro ao processar o XML: Parsing error');
  });

  it('should return 500 if fetching tax regime history fails', async () => {
    mockReq.method = 'POST';
    mockReq.body = '<nfeProc><NFe><infNFe><ide><dhEmi>2025-01-01</dhEmi></ide><emit><enderEmit/></emit><dest><enderDest/></dest><total><ICMSTot/></total></infNFe></NFe></nfeProc>'; // Minimal valid XML
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({ organization_id: 'org1' });
    (parseStringPromise as vi.Mock).mockResolvedValueOnce(createMockParsedNFe());

    const mockDbError = new Error('DB Error');
    (getSupabaseClient as vi.Mock).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ error: mockDbError, data: null }),
    });
    (formatSupabaseError as vi.Mock).mockReturnValueOnce('Formatted DB Error');

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 500, 'Formatted DB Error');
    expect(logger.error).toHaveBeenCalledWith(
      `[NFe Import] Erro ao buscar histórico de regime tributário: ${mockDbError.message}`,
    );
  });

  it('should process XML and extract data successfully (simple case)', async () => {
    mockReq.method = 'POST';
    mockReq.body = '<nfeProc><NFe><infNFe Id="NFe123"><ide><dhEmi>2025-01-01</dhEmi><tpNF>0</tpNF></ide><emit><CNPJ>12345678901234</CNPJ><xNome>Emitente Teste</xNome><enderEmit><UF>SP</UF><xMun>Sao Paulo</xMun></enderEmit></emit><dest><CNPJ>98765432109876</CNPJ><xNome>Destinatario Teste</xNome><enderDest><UF>RJ</UF><xMun>Rio de Janeiro</xMun></enderDest></dest><total><ICMSTot><vProd>100.00</vProd><vNF>120.00</vNF><vICMS>18.00</vICMS><vIPI>2.00</vIPI><vPIS>0.65</vPIS><vCOFINS>3.00</vCOFINS></ICMSTot></total><det><prod><xProd>Produto A</xProd><NCM>12345678</NCM><qCom>1</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod><imposto><ICMS><ICMS><vICMS>18.00</vICMS></ICMS></ICMS><IPI><IPITrib><vIPI>2.00</vIPI></IPITrib></IPI><PIS><PISAliq><vPIS>0.65</vPIS></PISAliq></PIS><COFINS><COFINSAliq><vCOFINS>3.00</vCOFINS></COFINSAliq></COFINS></imposto></det></infNFe></NFe></nfeProc>';
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({ organization_id: 'org1' });
    (parseStringPromise as vi.Mock).mockResolvedValueOnce(createMockParsedNFe({
      ide: { tpNF: '0' }, // Ensure tpNF is '0' for 'entrada'
      total: { ICMSTot: { vPIS: '0.65', vCOFINS: '3.00' } }, // Ensure PIS/COFINS are present
    }));
    (getSupabaseClient as vi.Mock).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "XML processado com sucesso!",
      data: expect.objectContaining({
        nfe_id: 'NFe123',
        emission_date: '2025-01-01',
        type: 'entrada',
        cnpj_emit: '12345678901234',
        razao_social_emit: 'Emitente Teste',
        uf_emit: 'SP',
        municipio_emit: 'Sao Paulo',
        cnpj_dest: '98765432109876',
        razao_social_dest: 'Destinatario Teste',
        uf_dest: 'RJ',
        municipio_dest: 'Rio de Janeiro',
        total_products: 100.00,
        total_nfe: 120.00,
        total_icms: 18.00,
        total_ipi: 2.00,
        total_pis: 0.65,
        total_cofins: 3.00,
        organization_tax_regime: null,
        items: expect.arrayContaining([
          expect.objectContaining({
            description: 'Produto A',
            ncm: '12345678',
            quantity: 1,
            unit_value: 100,
            total_value: 100,
            icms_value: 18,
            ipi_value: 2,
            pis_value: 0.65,
            cofins_value: 3,
          }),
        ]),
      }),
    });
    expect(logger.info).toHaveBeenCalledWith('[NFe Import] Dados extraídos e regime determinado:', expect.any(Object));
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should process XML and extract data successfully with tax regime found', async () => {
    mockReq.method = 'POST';
    mockReq.body = '<nfeProc><NFe><infNFe Id="NFe123"><ide><dhEmi>2025-01-01</dhEmi><tpNF>0</tpNF></ide><emit><CNPJ>12345678901234</CNPJ><xNome>Emitente Teste</xNome><enderEmit><UF>SP</UF><xMun>Sao Paulo</xMun></enderEmit></emit><dest><CNPJ>98765432109876</CNPJ><xNome>Destinatario Teste</xNome><enderDest><UF>RJ</UF><xMun>Rio de Janeiro</xMun></enderDest></dest><total><ICMSTot><vProd>100.00</vProd><vNF>120.00</vNF><vICMS>18.00</vICMS><vIPI>2.00</vIPI><vPIS>0.65</vPIS><vCOFINS>3.00</vCOFINS></ICMSTot></total><det><prod><xProd>Produto A</xProd><NCM>12345678</NCM><qCom>1</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod><imposto><ICMS><ICMS><vICMS>18.00</vICMS></ICMS></ICMS><IPI><IPITrib><vIPI>2.00</vIPI></IPITrib></IPI><PIS><PISAliq><vPIS>0.65</vPIS></PISAliq></PIS><COFINS><COFINSAliq><vCOFINS>3.00</vCOFINS></COFINSAliq></COFINS></imposto></det></infNFe></NFe></nfeProc>';
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({ organization_id: 'org1' });
    (parseStringPromise as vi.Mock).mockResolvedValueOnce(createMockParsedNFe({
      ide: { tpNF: '0' }, // Ensure tpNF is '0' for 'entrada'
      total: { ICMSTot: { vPIS: '0.65', vCOFINS: '3.00' } }, // Ensure PIS/COFINS are present
    }));
    (getSupabaseClient as vi.Mock).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ start_date: '2025-01-01', end_date: '2025-12-31', regime: 'Simples Nacional' }], error: null }),
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "XML processado com sucesso!",
      data: expect.objectContaining({
        organization_tax_regime: 'Simples Nacional',
      }),
    });
  });
});
