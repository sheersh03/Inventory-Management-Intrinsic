import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  products: {
    list: async () => ipcRenderer.invoke('products:list'),
    create: async (p: any) => ipcRenderer.invoke('products:create', p),
    update: async (p: any) => ipcRenderer.invoke('products:update', p),
    delete: async (id: number) => ipcRenderer.invoke('products:delete', id)
  },
  tx: {
    list: async () => ipcRenderer.invoke('tx:list'),
    create: async (t: any) => ipcRenderer.invoke('tx:create', t)
  },
  exportCsv: async () => ipcRenderer.invoke('export:productsCsv')
  ,
  invoice: {
    generate: async (payload: { invoiceNo: number; html: string }) => ipcRenderer.invoke('invoice:generate', payload)
  }
});
