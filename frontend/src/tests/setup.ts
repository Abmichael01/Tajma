import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'

// Mocking some globals that are not available in JSDOM if needed
// global.ResizeObserver = require('resize-observer-polyfill')

export const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
