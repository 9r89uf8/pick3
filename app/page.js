'use client';
// app/page.js
import React, { useEffect, useState } from 'react';
import { fetchPosts, createPost, createAllPosts, checkPosts } from './services/postService'; // Import the fetchPosts service
import { createHistory } from "@/app/services/historyService";
import { analyze60, analyze10K, gatherIntel } from "@/app/services/testingService";
import NumberFrequencyChart from "@/app/components/NumberFrequencyChart";
import Link from 'next/link';
import DrawsList from "@/app/components/DrawsList";
import { Button, List, ListItem, Container, Typography, Box } from '@mui/material';
import { alpha, styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { useStore } from '@/app/store/store';
import { createDataCollection } from "@/app/services/dataService";
import { playNums } from "@/app/services/playService";
import NumbersList from "@/app/components/NumbersList";
import PostCreationButtons from "@/app/components/PostCreationButtons";
import DisplayData from "@/app/components/DisplayData";
import ProbabilityDisplay from "@/app/components/ProbabilityDisplay";
import AnalysisDashboard from "@/app/components/AnalysisDashboard";

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  marginTop: 15,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.1)', // semi-transparent white
  backdropFilter: 'blur(10px)', // apply blur
  borderRadius: 10, // rounded corners
  border: `1px solid ${alpha('#ffffff', 0.2)}`,
}));

const HomePage = () => {

  const posts = useStore((state) => state.posts);
  const numbers = useStore((state) => state.numbers);
  const loadingCheck = useStore((state) => state.checkLoading);
  const clearNumbers = useStore((state) => state.clearNumbers); // Get the clearNumbers function

  // State variable to toggle AnalysisDashboard
  const [showDashboard, setShowDashboard] = useState(false);

  // Fetch posts on component mount
  useEffect(() => {
    const getPosts = async () => {
      const fetchedPosts = await fetchPosts(); // Call the fetchPosts function
    };

    getPosts();
  }, []); // Empty dependency array ensures this runs only once on mount


  const play = async () => {
    await playNums()
    // await createDataCollection();

  };

  const playTwo = async () => {
    await analyze10K();

  };

  const check = async () => {
    await checkPosts();
  };

  const handleClear = () => {
    clearNumbers(); // Call clearNumbers to clear the numbers array
  };

  return (

      <Box sx={{ width: '100%' }}>

        <Container maxWidth="sm">
          <Item elevation={4}>


            <PostCreationButtons />


            {numbers&&numbers.length>0 &&
                <Box display="flex" flexDirection="column" alignItems="center">
                  <List>
                    <NumbersList combinations={numbers} />
                  </List>
                </Box>
            }

            <div>
              <Button
                  variant="contained"
                  color="primary"
                  size='large'
                  style={{ marginTop: 12 }}
                  onClick={() => play()}
                  sx={{
                    background: 'linear-gradient(to right, #ffc300, #ffd60a)', // Yellow gradient
                    color: 'black',
                    // Add more styling as needed
                  }}
              >
                Play
              </Button>

            </div>

            {/*<div>*/}
            {/*  <Button*/}
            {/*      variant="contained"*/}
            {/*      color="primary"*/}
            {/*      size='large'*/}
            {/*      style={{ marginTop: 12 }}*/}
            {/*      onClick={() => playTwo()}*/}
            {/*      sx={{*/}
            {/*        background: 'linear-gradient(to right, #ffc300, #ffd60a)', // Yellow gradient*/}
            {/*        color: 'black',*/}
            {/*        // Add more styling as needed*/}
            {/*      }}*/}
            {/*  >*/}
            {/*    PlayTwo*/}
            {/*  </Button>*/}

            {/*</div>*/}

            {numbers && numbers.length <= 0 &&
                <div>
                  <Button
                      variant="contained"
                      color="primary"
                      size='large'
                      style={{ marginTop: 12 }}
                      onClick={() => check()}
                      sx={{
                        background: 'linear-gradient(to right, #ffffff, #e5e5e5)', // Light gradient
                        color: 'black',
                        // Add more styling as needed
                      }}
                      disabled={loadingCheck}
                  >
                    Check
                  </Button>

                </div>
            }


            {numbers && numbers.length>0 &&
                <div>
                  <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      style={{ marginTop: 12 }}
                      onClick={handleClear} // Call handleClear to clear numbers
                      sx={{
                        background: 'linear-gradient(to right, #ef233c, #d90429)', // Red gradient
                        color: 'black',
                      }}
                  >
                    Clear
                  </Button>
                </div>
            }

            {/* Toggle Button for AnalysisDashboard */}
            <div>
              <Button
                  variant="contained"
                  color="primary"
                  size='large'
                  style={{ marginTop: 12 }}
                  onClick={() => setShowDashboard(!showDashboard)}
                  sx={{
                    background: 'linear-gradient(to right, #ffc300, #ffd60a)', // Yellow gradient
                    color: 'black',
                  }}
              >
                {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
              </Button>
            </div>

          </Item>
        </Container>

        {showDashboard && <ProbabilityDisplay />}
        {/* Conditionally render AnalysisDashboard */}
        {/*{showDashboard && <AnalysisDashboard />}*/}
        {showDashboard && <DisplayData />}

        {/*<NumberFrequencyChart/>*/}


        {posts.length > 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center">
              <List>
                <DrawsList draws={posts} />
              </List>
            </Box>
        ) : (
            <p>No posts available</p>
        )}
      </Box>
  );
};

export default HomePage;

