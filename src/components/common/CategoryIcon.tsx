import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  Heart,
  Layers,
  Briefcase,
  TrendingUp,
  Coins,
  Gift,
  ArrowDownLeft,
  Coffee,
  Smartphone,
  Plane,
  Smile,
  Tv,
  CreditCard,
  Package,
  Folder,
  Camera,
  Tag,
  DollarSign,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Utensils':
      return <Utensils {...props} />;
    case 'Car':
      return <Car {...props} />;
    case 'ShoppingBag':
      return <ShoppingBag {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'Film':
      return <Film {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'Heart':
      return <Heart {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Briefcase':
      return <Briefcase {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'Coins':
      return <Coins {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'ArrowDownLeft':
      return <ArrowDownLeft {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    case 'Plane':
      return <Plane {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'Tv':
      return <Tv {...props} />;
    case 'CreditCard':
      return <CreditCard {...props} />;
    case 'Package':
      return <Package {...props} />;
    case 'Folder':
      return <Folder {...props} />;
    case 'Camera':
      return <Camera {...props} />;
    case 'DollarSign':
      return <DollarSign {...props} />;
    default:
      return <Tag {...props} />;
  }
};
