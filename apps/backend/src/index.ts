// Ponto de entrada para desenvolvimento local.
// Em produção (Lambda), o entrypoint é src/lambda.ts.
import 'dotenv/config'
import { buildApp } from './app'

const app = buildApp()
const PORT = Number(process.env.PORT ?? 3002)
app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`)
})
