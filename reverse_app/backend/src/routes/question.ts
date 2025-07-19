import { Router, Request, Response, NextFunction } from 'express';
import { reverseText } from '../services/reverseService';

const router = Router();

interface QuestionRequest {
  text: string;
}

router.post('/', async (req: Request<{}, {}, QuestionRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ 
        error: 'Invalid input. Text field is required and must be a string.' 
      });
      return;
    }

    if (text.length > 100) {
      res.status(400).json({ 
        error: 'Text exceeds maximum length of 100 characters.' 
      });
      return;
    }

    const reversedText = reverseText(text);

    res.json({
      original: text,
      reversed: reversedText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;