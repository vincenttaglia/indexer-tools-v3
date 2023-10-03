// Utilities
import { defineStore } from 'pinia'
import { useAccountStore } from './accounts'
const accountStore = useAccountStore();

export const useDeploymentStatusStore = defineStore('deploymentStatusStore', {
  state: () => ({
    status: [],
  }),
  getters: {
    getIndexerUrl: () => accountStore.getActiveUrl,
    getDeploymentStatuses: (state) => state.status,
  },
  actions: {
    async update(){
      console.log("UPDATE STATUS");
      const url = new URL('/status', this.getIndexerUrl);
      console.log(url.href);
      fetch(url.href,  {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({query: "{ indexingStatuses { subgraph synced health fatalError{ message deterministic block{ hash number } } node chains{ latestBlock{number} chainHeadBlock{number} earliestBlock{number} } } }"}),
      })
      .then((res) => res.json())
      .then((json) => {
        console.log("SAVING STATUS")
        console.log(json);
        this.status = json.data.indexingStatuses;
      });
    }
  },
})
