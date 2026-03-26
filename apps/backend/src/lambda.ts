// Handler Lambda — não importa dotenv (variáveis injetadas pelo Lambda runtime).
import serverlessExpress from '@vendia/serverless-express'
import { buildApp } from './app'

const app = buildApp()

// serverlessExpress retorna o handler (event, context) => Promise pronto para o Lambda.
// O app é inicializado uma vez no cold start e reutilizado entre invocações.
export const handler = serverlessExpress({ app })
