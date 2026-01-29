import axios from 'axios'

export default function setupApi(app) {
  const api = axios.create({
    baseURL: 'https://timely.edu.netlor.fr'
  })

  app.config.globalProperties.$api = api
}
