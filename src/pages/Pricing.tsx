import React from 'react';
import { Box, Container, Grid, Card, CardContent, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { SUBSCRIPTION_PLANS } from '@constants/index';

export const Pricing: React.FC = () => {
  const features = [
    { name: 'Access to Onsite jobs', free: true, basic: true, premium: true, pro: true },
    { name: 'View job details', free: true, basic: true, premium: true, pro: true },
    { name: 'Save jobs', free: false, basic: '5 jobs', premium: 'Unlimited', pro: 'Unlimited' },
    { name: 'Access to Remote jobs', free: false, basic: false, premium: true, pro: true },
    { name: 'Access to Hybrid jobs', free: false, basic: false, premium: true, pro: true },
    { name: 'Email notifications', free: false, basic: true, premium: true, pro: true },
    { name: 'Apply without resume upload', free: false, basic: false, premium: true, pro: true },
    { name: 'Weekly job digest', free: false, basic: false, premium: true, pro: true },
    { name: 'Priority job recommendations', free: false, basic: false, premium: true, pro: true },
    { name: 'Early access to new jobs', free: false, basic: false, premium: false, pro: true },
    { name: 'Mock interview sessions', free: false, basic: false, premium: false, pro: true },
    { name: '1-on-1 career coaching', free: false, basic: false, premium: false, pro: true },
    { name: 'Resume review & optimization', free: false, basic: false, premium: false, pro: true },
    { name: 'Portfolio building assistance', free: false, basic: false, premium: false, pro: true },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Choose the plan that's right for you
          </Typography>
        </Box>

        {/* Plans */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.recommended ? '2px solid' : '1px solid',
                  borderColor: plan.recommended ? 'primary.main' : 'rgba(148, 163, 184, 0.1)',
                  transform: plan.recommended ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Most Popular
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: plan.recommended ? 3 : 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', display: 'inline' }}>
                      ₹{plan.price}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      /{plan.period}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, flex: 1 }}>
                    {plan.features.map((feature) => (
                      <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button variant={plan.recommended ? 'contained' : 'outlined'} fullWidth>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Comparison Table */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Detailed Comparison
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Free
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Basic
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Premium
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Pro
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell align="center">
                      {feature.free === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.free === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.free}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.basic === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.basic === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.basic}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.premium === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.premium === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.premium}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.pro === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.pro === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.pro}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* FAQ */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Have questions?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Check our FAQ or contact our support team at support@actotechjobs.com
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
};
