import { FC } from 'react';

type Size = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

const sizeMap = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
};

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${sizeMap[size]}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
