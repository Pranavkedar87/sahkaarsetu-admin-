import React from 'react';
import logoImg from '../../assets/logo.png';

export interface SahkaarSetuLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export const SahkaarSetuLogo: React.FC<SahkaarSetuLogoProps> = ({
  size = 32,
  className = '',
  style = {},
  alt = 'SahkaarSetu Logo',
  ...props
}) => (
  <img
    src={logoImg}
    alt={alt}
    width={size}
    height={size}
    className={`sahkaar-brand-logo ${className}`}
    style={{
      width: size,
      height: size,
      objectFit: 'contain',
      borderRadius: '50%',
      display: 'inline-block',
      flexShrink: 0,
      ...style,
    }}
    {...props}
  />
);

export default SahkaarSetuLogo;
