import { Box } from '@mui/material';

export default function Goose() {
  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.2',
        textAlign: 'center',
        userSelect: 'none',
        mb: 3,
      }}
    >
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre',
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
  );
}

