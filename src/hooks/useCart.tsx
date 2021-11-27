import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart])

  const addProduct = async (productId: number) => {
    
    try {
      const response = await api.get(`/stock/${productId}`);
       
      if (response.status === 404) {
        toast.error('Erro na adição do produto');
        return;
      }
      
      const product = cart.find(product => product.id === productId); 
    
      
      if (product) {
        if (product.amount + 1 > response.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(item => item.id !== productId? item: ({...item, amount: item.amount + 1}));
        setCart(newCart);
      } else {
        const response = await api.get(`/products/${productId}`);

        setCart([...cart, {...response.data, amount: 1}]);
        
      }

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      setCart(cart.filter(({ id}) => id !== productId))
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return;
    try {
      // TODO
      const response = await api.get(`/stock/${productId}`);
      if (response.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      setCart(cart.map(item => item.id !== productId? item: {...item, amount}));

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
