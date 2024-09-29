import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  VStack,
  Grid,
  Text,
} from "@chakra-ui/react";
import io from "socket.io-client";
import axios from "axios";

const WaitingRoom = () => {
  const [patients, setPatients] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const toast = useToast();
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );
        setPatients(response?.data?.visits);
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

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("update-waiting-room", (visit) => {
      setCurrentVisit(visit._id);
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

  const getRowBackgroundColor = (status) => {
    switch (status) {
      case "In Progress":
        return "blue.100";
      case "Pending":
        return "orange.100";
      default:
        return "white";
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && patients.length >= 9) {
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      const scrollStep = 1;
      const scrollInterval = setInterval(() => {
        if (scrollContainer.scrollTop + clientHeight >= scrollHeight - 1) {
          scrollContainer.scrollTop = 0;
        } else {
          scrollContainer.scrollTop += scrollStep;
        }
      }, 50);

      return () => clearInterval(scrollInterval);
    }
  }, [patients]);

  return (
    <Box w="100%" px={6} maxW="1200px" mx="auto">
      <Heading
        fontWeight="semibold"
        color="gray.700"
        textAlign="center"
        fontSize="3xl"
        mb={6}
        borderBottom="2px solid"
        pb={2}
        borderColor="blue.400"
      >
        Waiting Room
      </Heading>

      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
        <Box>
          {currentVisit && (
            <Box
              p={6}
              borderRadius="md"
              mb={8}
              textAlign="center"
              bg="blue.50"
              borderWidth={1}
              borderColor="blue.400"
              shadow="lg"
            >
              <Text fontSize="xl" fontWeight="bold" color="blue.800">
                Current Patient
              </Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Please proceed to the Doctor Room.
              </Text>
            </Box>
          )}
        </Box>

        <Box>
          <Heading size="lg" mb={4} textAlign="center" color="blue.600">
            Today's Registered Patients
          </Heading>

          {patients.length > 0 ? (
            <Box
              maxH="400px"
              boxShadow="lg"
              rounded="md"
              p={0}
              overflow="hidden"
            >
              <Box ref={scrollRef} overflowY="auto" maxH="400px">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Visit ID
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Patient Name
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Guardian Name
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Status
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {patients.map((patient) => (
                      <Tr
                        key={patient._id}
                        height="50px"
                        bg={getRowBackgroundColor(patient.status)}
                        _hover={{ bg: "gray.100" }} // Add hover effect
                      >
                        <Td p={2}>{patient._id}</Td>
                        <Td p={2}>{patient.patient.patientName}</Td>
                        <Td p={2}>{patient.patient.guardianName}</Td>
                        <Td p={2}>{patient.status}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          ) : (
            <VStack h="60vh" justify="center" align="center" spacing={6}>
              <Heading
                p={4}
                bgGradient="linear(to-r, red.300, red.500)"
                bgClip="text"
                size="lg"
              >
                No Patients Registered Today
              </Heading>
            </VStack>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default WaitingRoom;
