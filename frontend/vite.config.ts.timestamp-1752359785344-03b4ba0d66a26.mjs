// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/guilh/OneDrive/Documentos/GitHub/finvy/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/guilh/OneDrive/Documentos/GitHub/finvy/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import tailwindcss from "file:///C:/Users/guilh/OneDrive/Documentos/GitHub/finvy/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import { visualizer } from "file:///C:/Users/guilh/OneDrive/Documentos/GitHub/finvy/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/guilh/OneDrive/Documentos/GitHub/finvy/frontend/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    visualizer({
      filename: "bundle-analysis.html",
      open: true
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "primeicons": fileURLToPath(new URL("../node_modules/primeicons", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("primevue") || id.includes("primeicons")) {
              return "primevue";
            }
            if (id.includes("zod")) {
              return "zod";
            }
            if (id.includes("axios")) {
              return "axios";
            }
            if (id.includes("pinia")) {
              return "pinia";
            }
            if (id.includes("vue")) {
              return "vue";
            }
            if (id.includes("vue-router")) {
              return "vue-router";
            }
            if (id.includes("vee-validate")) {
              return "vee-validate";
            }
            if (id.includes("@supabase/supabase-js")) {
              return "supabase";
            }
            return "vendor";
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ["primevue", "primeicons"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxndWlsaFxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXEdpdEh1YlxcXFxmaW52eVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ3VpbGhcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxHaXRIdWJcXFxcZmludnlcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2d1aWxoL09uZURyaXZlL0RvY3VtZW50b3MvR2l0SHViL2ZpbnZ5L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgdGFpbHdpbmRjc3MoKSxcbiAgICB2aXN1YWxpemVyKHtcbiAgICAgIGZpbGVuYW1lOiAnYnVuZGxlLWFuYWx5c2lzLmh0bWwnLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICdwcmltZWljb25zJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuLi9ub2RlX21vZHVsZXMvcHJpbWVpY29ucycsIGltcG9ydC5tZXRhLnVybCkpXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIFxuICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdwcmltZXZ1ZScpIHx8IGlkLmluY2x1ZGVzKCdwcmltZWljb25zJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwcmltZXZ1ZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3pvZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnem9kJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnYXhpb3MnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2F4aW9zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncGluaWEnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3BpbmlhJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygndnVlJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2dWUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd2dWUtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2dWUtcm91dGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygndmVlLXZhbGlkYXRlJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZWUtdmFsaWRhdGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJzsgLy8gQWdydXBhIG91dHJhcyBkZXBlbmRcdTAwRUFuY2lhcyBlbSB1bSBjaHVuayAndmVuZG9yJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydwcmltZXZ1ZScsICdwcmltZWljb25zJ10sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVyxTQUFTLGVBQWUsV0FBVztBQUM3WSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxrQkFBa0I7QUFKNE0sSUFBTSwyQ0FBMkM7QUFNeFIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsTUFDcEQsY0FBYyxjQUFjLElBQUksSUFBSSw4QkFBOEIsd0NBQWUsQ0FBQztBQUFBLElBQ3BGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBRVIsYUFBYSxJQUFJO0FBQ2IsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLGdCQUFJLEdBQUcsU0FBUyxVQUFVLEtBQUssR0FBRyxTQUFTLFlBQVksR0FBRztBQUN4RCxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsS0FBSyxHQUFHO0FBQ3RCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEdBQUc7QUFDeEIscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLE9BQU8sR0FBRztBQUN4QixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsS0FBSyxHQUFHO0FBQ3RCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxZQUFZLEdBQUc7QUFDN0IscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsdUJBQXVCLEdBQUc7QUFDeEMscUJBQU87QUFBQSxZQUNUO0FBQ0EsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFlBQVksWUFBWTtBQUFBLEVBQ3BDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
