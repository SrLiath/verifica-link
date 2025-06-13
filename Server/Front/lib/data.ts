import type { Client } from './types'


export let clientsData: Client[] = []

/**
 * Função para atualizar os dados a partir da API
 */
export async function fetchClients() {
  try {
    if (!process.env.NEXT_PUBLIC_API) throw new Error('API endpoint não definido')
    const res = await fetch(process.env.NEXT_PUBLIC_API as string)
    const data: Client[] = await res.json()

    
    clientsData = data

    return data
  } catch (err) {
    console.error('Falha ao atualizar clientes:', err)
  }
}