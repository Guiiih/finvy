// src/stores/productStore.ts
import { defineStore } from 'pinia';
import type { Product } from '../types/index'; 

interface ProductState {
  products: Product[];
}

export const useProductStore = defineStore('products', {
  state: (): ProductState => ({
    products: [
      { id: 'prod-x-1', name: 'Produto X', quantity: 0, unitPrice: 0 },
    ],
  }),
  actions: {
    addProduct(product: Product) {
      this.products.push(product);
    },
  },
  getters: {
    getAllProducts(state: ProductState) { // Adicione ': ProductState' aqui
      return state.products;
    },
    getProductById: (state: ProductState) => (id: string) => { // Adicione ': ProductState' aqui
      return state.products.find(product => product.id === id);
    },
    getProductByName: (state: ProductState) => (name: string) => { // Adicione ': ProductState' aqui
      return state.products.find(product => product.name === name);
    }
  },
});