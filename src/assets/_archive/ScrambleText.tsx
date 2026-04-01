import { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';

interface ScrambleTextProps extends Omit<TypographyProps, 'children'> {
  text: string;
  trigger?: boolean;
}

const CHARACTERS = '!@&<>?/\\|{}▀■□▪▫';

const ScrambleText = ({ text, trigger, ...props }: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) {
      // Render a statically scrambled string before the trigger is activated
      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' ';
        } else {
          result += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }
      setDisplayText(result);
      return;
    }

    let iteration = 0;
    const maxIterations = text.length;
    // Dynamically calculate iterations to finish revealing the string in ~20 frames (~333ms at 60fps)
    const iterationsPerFrame = Math.max(text.length / 20, 2); 

    const updateText = () => {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' ';
          continue;
        }
        if (i < Math.floor(iteration)) {
          result += text[i];
        } else {
          result += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }
      
      setDisplayText(result);

      if (iteration < maxIterations) {
        iteration += iterationsPerFrame;
        frameRef.current = requestAnimationFrame(updateText);
      } else {
        setDisplayText(text);
      }
    };

    frameRef.current = requestAnimationFrame(updateText);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text, trigger]);

  return (
    <Typography {...props}>
      {displayText}
    </Typography>
  );
};

export default ScrambleText;