const crypto = require('crypto')
const senha = "oia123dsahk"

const base64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64url = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64')
}

const encriptar = (texto) => {
  const iv = crypto.randomBytes(12)
  const chave = crypto.scryptSync(senha, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', chave, iv)
  const encrypted = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return base64url(Buffer.concat([iv, tag, encrypted]))
}

const decriptar = (conteudo) => {
  const dados = fromBase64url(conteudo)
  const iv = dados.slice(0, 12)
  const tag = dados.slice(12, 28)
  const texto = dados.slice(28)
  const chave = crypto.scryptSync(senha, 'salt', 32)
  const decipher = crypto.createDecipheriv('aes-256-gcm', chave, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(texto), decipher.final()])
  return decrypted.toString('utf8')
}

module.exports = { encriptar, decriptar }
