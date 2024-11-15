'use client';
import React, { useEffect, useState } from 'react';
import { fetchPosts } from './services/postService';
import DrawsList from "@/app/components/DrawsList";
import {
  Button,
  List,
  Container,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import { alpha, styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { useStore } from '@/app/store/store';
import { playNums, checkDraws } from "@/app/services/playService";
import NumbersList from "@/app/components/NumbersList";
import PostCreationButtons from "@/app/components/PostCreationButtons";
import DisplayData from "@/app/components/DisplayData";
import ProbabilityDisplay from "@/app/components/ProbabilityDisplay";

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  marginTop: 15,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: 10,
  border: `1px solid ${alpha('#ffffff', 0.2)}`,
}));

const NumberSelectionBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.05)',
  border: `1px solid ${alpha('#ffffff', 0.1)}`,
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  width: '40px',
  height: '40px',
  fontSize: 30,
  margin: '4px',
  borderRadius: '8px',
  color: '#ffffff',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  '&.Mui-selected': {
    backgroundColor: alpha('#9f0000', 0.6),
    color: '#000000',
    '&:hover': {
      backgroundColor: alpha('#9f0000', 0.8),
    },
  },
  '&:hover': {
    backgroundColor: alpha('#ffffff', 0.1),
  },
}));

const HomePage = () => {
  const posts = useStore((state) => state.posts);
  const numbers = useStore((state) => state.numbers);
  const [loading, setLoading] = useState(false);
  const clearNumbers = useStore((state) => state.clearNumbers);
  const [showDashboard, setShowDashboard] = useState(false);

  const [excludedNumbers, setExcludedNumbers] = useState({
    first: [],
    second: [],
    third: []
  });

  useEffect(() => {
    const getPosts = async () => {
      await fetchPosts();
    };
    getPosts();
  }, []);

  const handleNumberToggle = (position, value) => {
    setExcludedNumbers(prev => ({
      ...prev,
      [position]: prev[position].includes(value)
          ? prev[position].filter(n => n !== value)
          : [...prev[position], value]
    }));
  };

  const handlePlay = async () => {
    setLoading(true)
    await playNums({ excludedNumbers });
    setLoading(false)
  };

  const handleClear = () => {
    clearNumbers();
    setExcludedNumbers({ first: [], second: [], third: [] });
  };

  const renderNumberSelection = (position, numbers, label) => (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
          {label}
        </Typography>
        <ToggleButtonGroup value={excludedNumbers[position]} sx={{ flexWrap: 'wrap' }}>
          {numbers.map((number) => (
              <StyledToggleButton
                  key={number}
                  value={number}
                  selected={excludedNumbers[position].includes(number)}
                  onChange={() => handleNumberToggle(position, number)}
              >
                {number}
              </StyledToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
  );

  return (
      <Box sx={{ width: '100%' }}>
        <Container maxWidth="sm">
          <Item elevation={4}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffc300' }}>
                Select Numbers to Exclude
              </Typography>

              <Stack spacing={3}>
                {renderNumberSelection('first', [0, 1, 2], 'First Position')}
                {renderNumberSelection('second', [3, 4, 5, 6], 'Second Position')}
                {renderNumberSelection('third', [7, 8, 9], 'Third Position')}
              </Stack>

              <Button
                  variant="contained"
                  disabled={loading}
                  size="large"
                  onClick={handlePlay}
                  sx={{
                    mt: 3,
                    mb: 1,
                    background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                    color: 'black',
                    minWidth: 200,
                  }}
              >
                Play
              </Button>

            {numbers && numbers.length > 0 && (
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Button
                      variant="contained"
                      size="large"
                      onClick={handleClear}
                      sx={{
                        mt: 2,
                        background: 'linear-gradient(to right, #ef233c, #d90429)',
                        color: 'black',
                      }}
                  >
                    Clear
                  </Button>
                  <List>
                    <NumbersList combinations={numbers} />
                  </List>
                </Box>
            )}
          </Item>


          <Item elevation={4}>
            <PostCreationButtons />

            {/*{numbers && numbers.length <= 0 && (*/}
            {/*    <Button*/}
            {/*        variant="contained"*/}
            {/*        size="large"*/}
            {/*        onClick={() => checkDraws()}*/}
            {/*        disabled={loadingCheck}*/}
            {/*        sx={{*/}
            {/*          mt: 2,*/}
            {/*          background: 'linear-gradient(to right, #ffffff, #e5e5e5)',*/}
            {/*          color: 'black',*/}
            {/*        }}*/}
            {/*    >*/}
            {/*      Check*/}
            {/*    </Button>*/}
            {/*)}*/}

            <Button
                variant="contained"
                size="large"
                onClick={() => setShowDashboard(!showDashboard)}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(to right, #6c757d, #495057)',
                  color: 'black',
                }}
            >
              {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
            </Button>
          </Item>

          {showDashboard && <DisplayData />}
          {showDashboard && <ProbabilityDisplay />}

        </Container>

        {posts.length > 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center">
              <List>
                <DrawsList draws={posts} />
              </List>
            </Box>
        ) : (
            <Typography sx={{ textAlign: 'center', mt: 2 }}>No posts available</Typography>
        )}
      </Box>
  );
};

export default HomePage;

