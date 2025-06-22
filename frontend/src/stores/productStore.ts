
import { defineStore } from 'pinia'
import type { Product } from '@/types' 

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [
      { id: '1', name: 'Caneta Azul', quantity: 150, unitPrice: 1.50 },
      { id: '2', name: 'Caderno 96fls', quantity: 40, unitPrice: 22.90 },
      { id: '3', name: 'Lapiseira 0.7mm', quantity: 85, unitPrice: 8.75 }
    ] as Product[]
  }),

  actions: {}
})