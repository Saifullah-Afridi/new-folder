// NotFound.js
import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleHomeRedirect = () => {
    navigate("/"); // Redirect to the home page
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      textAlign="center"
      bg="gray.100"
      p={6}
    >
      <Heading as="h1" size="2xl" mb={4} color="red.500">
        404 - Page Not Found
      </Heading>
      <Text fontSize="lg" mb={6}>
        The page you're looking for doesn't exist.
      </Text>
      <Button onClick={handleHomeRedirect} colorScheme="blue">
        Go to Home
      </Button>
    </Box>
  );
};

export default NotFound;
