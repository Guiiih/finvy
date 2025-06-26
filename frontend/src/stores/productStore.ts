// src/stores/productStore.ts
import { defineStore } from 'pinia';
import type { Product } from '../types/index'; 

import { ref, computed } from 'vue';

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([]);

  async function fetchProducts() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      products.value = data;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }

  const getAllProducts = computed(() => products.value);

  const getProductById = computed(() => (id: string) => {
    return products.value.find(product => product.id === id);
  });

  const getProductByName = computed(() => (name: string) => {
    return products.value.find(product => product.name === name);
  });

  async function addProduct(product: Product) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProduct: Product = await response.json();
      products.value.push(newProduct);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  }

  async function updateProduct(id: string, updatedFields: Partial<Product>) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products?id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedProduct: Product = await response.json();
      const index = products.value.findIndex(prod => prod.id === id);
      if (index !== -1) {
        products.value[index] = updatedProduct;
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  }

  async function deleteProduct(id: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products?id=${id}`, {
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      products.value = products.value.filter(prod => prod.id !== id);
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    }
  }

  return {
    products,
    getAllProducts,
    getProductById,
    getProductByName,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
});