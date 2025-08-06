export interface Organization {
  id: string
  name: string
  cnpj: string | null
  razao_social: string | null
  uf: string | null
  municipio: string | null
  created_at: string
  is_personal: boolean
  is_shared: boolean
  shared_from_user_name: string | null
}
