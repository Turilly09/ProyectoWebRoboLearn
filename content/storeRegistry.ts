
import { Product } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Mock data inicial por si no hay DB
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'k1',
    name: 'Kit de Iniciación Arduino',
    description: 'Todo lo necesario para empezar con electrónica.',
    longDescription: 'Este kit completo incluye una placa compatible con Arduino Uno R3, protoboard, cables, LEDs, resistencias y sensores básicos. Es ideal para estudiantes y hobbistas que desean aprender programación y electrónica desde cero. Incluye una caja organizadora y acceso a tutoriales exclusivos.',
    price: 45.00,
    category: 'Kits',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    features: ['Placa Compatible Uno R3', 'Cable USB Tipo B', 'Guía de Proyectos PDF', 'Protoboard 830 Puntos', 'Jumper Wires M-M'],
    isNew: true
  },
  {
    id: 's1',
    name: 'Sensor Ultrasónico HC-SR04',
    description: 'Mide distancias de 2cm a 400cm con alta precisión.',
    longDescription: 'El sensor HC-SR04 utiliza sonar para determinar la distancia a un objeto. Ofrece una excelente precisión sin contacto y lecturas estables. Su funcionamiento no se ve afectado por la luz solar o material negro (aunque los materiales acústicamente blandos como la tela pueden ser difíciles de detectar).',
    price: 3.50,
    category: 'Sensores',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    stock: 120,
    features: ['Rango: 2cm-4m', 'Precisión: 3mm', '5V DC', 'Consumo: 15mA']
  }
];

export const getAllProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured || !supabase) return MOCK_PRODUCTS;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((p: any) => ({
        ...p,
        longDescription: p.long_description // Mapeo snake_case -> camelCase
    }));
  } catch (e) {
    console.error("Error fetching products:", e);
    return MOCK_PRODUCTS;
  }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  if (!isSupabaseConfigured || !supabase) {
    return MOCK_PRODUCTS.find(p => p.id === id);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return {
        ...data,
        longDescription: data.long_description // Mapeo snake_case -> camelCase
    };
  } catch (e) {
    return undefined;
  }
};

export const saveProduct = async (product: Product) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('products')
    .upsert({
      id: product.id.startsWith('new_') ? undefined : product.id, // Dejar que DB genere UUID si es nuevo
      name: product.name,
      description: product.description,
      long_description: product.longDescription, // Mapeo camelCase -> snake_case
      price: product.price,
      category: product.category,
      image: product.image,
      images: product.images,
      stock: product.stock,
      features: product.features
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('storeUpdated'));
};

export const deleteProduct = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('storeUpdated'));
};
