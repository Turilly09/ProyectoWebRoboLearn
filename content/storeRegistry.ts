
import { Product } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Mock data inicial por si no hay DB
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'k1',
    name: 'Kit de Iniciación Arduino',
    description: 'Todo lo necesario para empezar: Arduino Uno, Protoboard, LEDs, Resistencias y más.',
    price: 45.00,
    category: 'Kits',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    features: ['Placa Compatible Uno R3', 'Cable USB', 'Guía de Proyectos'],
    isNew: true
  },
  {
    id: 's1',
    name: 'Sensor Ultrasónico HC-SR04',
    description: 'Mide distancias de 2cm a 400cm con alta precisión. Ideal para robótica móvil.',
    price: 3.50,
    category: 'Sensores',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    stock: 120,
    features: ['Rango: 2cm-4m', 'Precisión: 3mm', '5V DC']
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
    return data || [];
  } catch (e) {
    console.error("Error fetching products:", e);
    return MOCK_PRODUCTS;
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
      price: product.price,
      category: product.category,
      image: product.image,
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
