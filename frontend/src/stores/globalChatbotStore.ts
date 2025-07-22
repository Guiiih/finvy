import { defineStore } from 'pinia';

export const useGlobalChatbotStore = defineStore('globalChatbot', {
  state: () => ({
    isChatbotModalVisible: false,
  }),
  actions: {
    setChatbotModalVisibility(visible: boolean) {
      this.isChatbotModalVisible = visible;
    },
    toggleChatbotModal() {
      this.isChatbotModalVisible = !this.isChatbotModalVisible;
    },
  },
});
