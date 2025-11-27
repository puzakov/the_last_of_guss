import { Box } from '@mui/material';
import { useState } from 'react';

interface GooseProps {
  onClick?: () => void;
  disabled?: boolean;
  isTapping?: boolean;
}

export default function Goose({ onClick, disabled = false, isTapping = false }: GooseProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled && !isTapping && onClick) {
      onClick();
    }
  };

  const handleMouseDown = () => {
    if (!disabled && !isTapping) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const canTap = !disabled && !isTapping && onClick;
  const isActive = canTap && isPressed;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        mb: 3,
      }}
    >
      <Box
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        sx={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.2',
          textAlign: 'center',
          userSelect: 'none',
          cursor: canTap ? 'pointer' : disabled ? 'not-allowed' : 'default',
          opacity: disabled || isTapping ? 0.5 : isActive ? 0.8 : 1,
          transform: isActive ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.1s ease-in-out',
          filter: disabled || isTapping ? 'grayscale(50%)' : 'none',
          '&:hover': {
            opacity: canTap ? (isActive ? 0.8 : 0.9) : undefined,
            transform: canTap && !isActive ? 'scale(1.02)' : undefined,
          },
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre',
            pointerEvents: 'none',
          }}
        >
          {`            ░░░░░░░░░░░░░░░            
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░           
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         
      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       
    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░   
    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░   
    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     
        ░░░░░░░░░░░░░░░░░░░░░░░░░░     `}
        </pre>
      </Box>
      {isTapping && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          Тапаю...
        </Box>
      )}
    </Box>
  );
}

