// NotFound.js
import React from "react";
import { Box, Heading, Text, Button, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleHomeRedirect = () => {
    navigate("/"); // Redirect to the home page
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
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
      <HStack spacing={4}>
        <Button onClick={handleGoBack} colorScheme="teal">
          Go Back
        </Button>
      </HStack>
    </Box>
  );
};

export default NotFound;
