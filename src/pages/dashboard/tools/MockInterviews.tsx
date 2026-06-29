import React, { useState } from 'react';
import Swal from '@utils/sweetAlert';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import { Layout } from '@components/layout/Layout';

const interviewQuestions = [
  {
    id: 1,
    role: 'Full Stack Developer',
    difficulty: 'Medium',
    question: 'How would you optimize a React component that re-renders too frequently?',
    tips: 'Consider useMemo, useCallback, React.memo, and profiling tools.',
  },
  {
    id: 2,
    role: 'Full Stack Developer',
    difficulty: 'Hard',
    question: 'Explain the event loop in JavaScript and how async/await works.',
    tips: 'Cover microtasks, macrotasks, call stack, and event loop phases.',
  },
  {
    id: 3,
    role: 'Full Stack Developer',
    difficulty: 'Medium',
    question: 'Design a scalable database schema for an e-commerce platform.',
    tips: 'Consider entities: users, products, orders, payments. Think about normalization.',
  },
  {
    id: 4,
    role: 'Frontend Developer',
    difficulty: 'Easy',
    question: 'What are the differences between let, const, and var?',
    tips: 'Discuss scope (function vs block), hoisting, and reassignment.',
  },
];

export const MockInterviews: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('Full Stack Developer');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [interviewActive, setInterviewActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [responses, setResponses] = useState<any[]>([]);

  const filteredQuestions = interviewQuestions.filter(
    (q) => q.role === selectedRole && q.difficulty === selectedDifficulty
  );

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const handleStartInterview = () => {
    setInterviewActive(true);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setUserResponse('');
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim()) {
      await Swal.fire({
        title: 'Response required',
        text: 'Please provide a response before moving forward.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    setResponses([
      ...responses,
      { question: currentQuestion.question, answer: userResponse },
    ]);

    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserResponse('');
    } else {
      setInterviewActive(false);
    }
  };

  if (interviewActive && currentQuestion) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <LinearProgress
              variant="determinate"
              value={((currentQuestionIndex + 1) / filteredQuestions.length) * 100}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
            </Typography>
          </Box>

          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(59,130,246,0.1) 100%)',
              border: '2px solid rgba(37,99,235,0.3)',
              borderRadius: 3,
              p: 4,
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Chip
                label={currentQuestion.difficulty}
                color={
                  currentQuestion.difficulty === 'Easy'
                    ? 'success'
                    : currentQuestion.difficulty === 'Medium'
                      ? 'warning'
                      : 'error'
                }
                sx={{ mb: 2 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {currentQuestion.question}
              </Typography>
              <Alert severity="info">{currentQuestion.tips}</Alert>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Type your response here..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setInterviewActive(false);
                  setCurrentQuestionIndex(0);
                  setResponses([]);
                }}
              >
                Exit Interview
              </Button>
              <Button variant="contained" onClick={handleSubmitResponse} sx={{ ml: 'auto' }}>
                {currentQuestionIndex === filteredQuestions.length - 1
                  ? 'Complete Interview'
                  : 'Next Question'}
              </Button>
            </Box>
          </Card>
        </Container>
      </Layout>
    );
  }

  if (responses.length > 0) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
              Interview Complete! 🎉
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Great effort! Here's a summary of your responses.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {responses.map((response, idx) => (
              <Grid item xs={12} key={idx}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Question {idx + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{response.question}"
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Your Response:
                    </Typography>
                    <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1 }}>
                      <Typography variant="body2">{response.answer}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setResponses([]);
              setUserResponse('');
            }}
            sx={{ mt: 4 }}
          >
            Take Another Interview
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Mock Interviews
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Practice with AI-powered interview questions for your target role.
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Select Role
                </Typography>
                <RadioGroup value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <FormControlLabel
                    value="Full Stack Developer"
                    control={<Radio />}
                    label="Full Stack Developer"
                  />
                  <FormControlLabel
                    value="Frontend Developer"
                    control={<Radio />}
                    label="Frontend Developer"
                  />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Select Difficulty
                </Typography>
                <RadioGroup value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                  <FormControlLabel value="Easy" control={<Radio />} label="Easy" />
                  <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                  <FormControlLabel value="Hard" control={<Radio />} label="Hard" />
                </RadioGroup>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              onClick={handleStartInterview}
              sx={{
                mt: 3,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                fontWeight: 700,
              }}
            >
              Start Interview ({filteredQuestions.length} Questions)
            </Button>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {['Full Stack Developer', 'Frontend Developer'].map((role) => (
            <Grid item xs={12} md={6} key={role}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {role}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Practice common interview questions and improve your skills.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedRole(role)}
                  >
                    Start Practice
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default MockInterviews;
