import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  useToast,
  Divider,
} from "@chakra-ui/react";
import io from "socket.io-client";

const WaitingRoom = () => {
  const [patients, setPatients] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const toast = useToast();

  // Fetch today's patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );
        setPatients(response.data.patients);
      } catch (error) {
        toast({
          title: "Error fetching patients.",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchPatients();
  }, [toast]);

  // Listen for socket updates
  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("update-waiting-room", (visit) => {
      setCurrentVisit(visit._id); // Update current visit ID
      toast({
        title: "New Visit Notified.",
        description: `Visit ID ${visit._id} has been notified.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  // Handle patient status update
  const handleUpdatePatient = async (patientId) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/v1/patient/update-status/${patientId}`,
        { status: "In Progress" }
      );
      toast({
        title: "Patient status updated.",
        description: "Patient status has been updated to 'In Progress'.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating patient status.",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box w="100%" pt={5} mx="auto">
      {/* Waiting Room Header */}
      <Box align="center">
        <Heading
          fontWeight="semibold"
          color="gray.600"
          borderBottom="2px"
          pb="3px"
          width="fit-content"
          fontSize="2xl"
          mb={3}
        >
          Waiting Room
        </Heading>
      </Box>

      {/* Current Visit Section */}
      {currentVisit && (
        <Box
          bg="blue.50"
          border="1px solid"
          borderColor="blue.300"
          p={5}
          borderRadius="md"
          mb={5}
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="bold" color="blue.700">
            Current Visit: {currentVisit}
          </Text>
        </Box>
      )}

      {/* Divider for separation */}
      <Divider my={5} />

      {/* Patients Registered Today */}
      <Heading size="lg" mb={3} textAlign="center">
        Today's Registered Patients
      </Heading>

      {patients?.length > 0 ? (
        <>
          {/* Infinite scrolling patient list */}
          <Box overflow="hidden" maxH="300px" position="relative">
            <Box
              as={VStack}
              spacing={4}
              animation="scrollUp 15s linear infinite"
              sx={{
                "@keyframes scrollUp": {
                  "0%": { transform: "translateY(0)" },
                  "100%": { transform: "translateY(-100%)" },
                },
              }}
            >
              {patients.map((patient) => (
                <Box
                  key={patient._id}
                  w="100%"
                  p={4}
                  bg="gray.100"
                  borderWidth="1px"
                  borderRadius="md"
                  shadow="sm"
                >
                  <Text>
                    <strong>Patient Name:</strong> {patient.patientName}
                  </Text>
                  <Text>
                    <strong>Status:</strong> {patient.status}
                  </Text>
                  <Button
                    colorScheme="blue"
                    mt={3}
                    onClick={() => handleUpdatePatient(patient._id)}
                  >
                    Update to In Progress
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      ) : (
        <Box
          h="100vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDir="column"
        >
          <Heading
            p={4}
            bgGradient="linear(to-r , red.300 , red.400)"
            width="fit-content"
            size="md"
          >
            No Patients Registered Today
          </Heading>
        </Box>
      )}
    </Box>
  );
};

export default WaitingRoom;
