import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const githubRepository = globalThis?.process?.env?.GITHUB_REPOSITORY || ''
const repoName = githubRepository.split('/')[1]
const isGithubActions = Boolean(globalThis?.process?.env?.GITHUB_ACTIONS)
const base = isGithubActions && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
