// src/utils/db.js
// Capa de acceso a datos usando Supabase (reemplaza localStorage)

import { supabase } from '../lib/supabase';

async function getConfigValue(clave) {
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.valor ?? null;
}

async function setConfigValue(clave, valor) {
  const { data: existing, error: existingError } = await supabase
    .from('configuracion')
    .select('clave')
    .eq('clave', clave)
    .limit(1);

  if (existingError) throw existingError;

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('configuracion')
      .update({ valor })
      .eq('clave', clave);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('configuracion')
    .insert({ clave, valor });
  if (error) throw error;
}

// ─── EMPRESA ────────────────────────────────────────────────────────────────

export async function getEmpresa() {
  const { data, error } = await supabase
    .from('empresa')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveEmpresa(empresa) {
  const { error } = await supabase
    .from('empresa')
    .upsert({ id: 1, ...empresa });
  if (error) throw error;
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────

export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('apellido');
  if (error) throw error;
  return data ?? [];
}

export async function saveClienteIfNew(cliente) {
  // Solo guarda si no existe uno con mismo nombre y apellido
  const { data: existing } = await supabase
    .from('clientes')
    .select('id')
    .eq('nombre', cliente.nombre)
    .eq('apellido', cliente.apellido)
    .maybeSingle();

  if (existing) return; // Ya existe, no duplicar

  const { error } = await supabase.from('clientes').insert({
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    direccion: cliente.direccion,
    email: cliente.email,
    telefono: cliente.telefono,
  });
  if (error) throw error;
}

// ─── REMITOS ─────────────────────────────────────────────────────────────────

export async function getRemitos() {
  const { data, error } = await supabase
    .from('remitos')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveRemito(remito) {
  const { error } = await supabase.from('remitos').insert({
    id: remito.id,
    numero: remito.numero,
    fecha: remito.fecha,
    cliente: remito.cliente,
    productos: remito.productos,
    total: remito.total,
  });
  if (error) throw error;
}

// ─── NÚMERO DE REMITO ────────────────────────────────────────────────────────

export async function getUltimoNumeroRemito() {
  const valor = await getConfigValue('ultimo-numero-remito');
  return valor ? parseInt(valor, 10) : 0;
}

export async function saveUltimoNumeroRemito(numero) {
  await setConfigValue('ultimo-numero-remito', numero.toString());
}

// ─── USUARIOS Y PERMISOS ───────────────────────────────────────────────────

export async function getUsuariosSistema() {
  const valor = await getConfigValue('usuarios-sistema');
  if (!valor) return null;

  try {
    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveUsuariosSistema(usuarios) {
  await setConfigValue('usuarios-sistema', JSON.stringify(usuarios ?? []));
}
