import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { login, sendOtp, verifyOtp } from "../actions/userActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { verifytok } from "../actions/userActions";
import { FaRegEnvelope, FaLock } from "react-icons/fa6";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isMobileNumber, setIsMobileNumber] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const showToast = (msg, status) => {
    toast({
      description: msg,
      status: status,
      duration: 3000,
      position: "bottom-left",
      isClosable: true,
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setEmail(value.toLowerCase());
    const mobileRegex = /^[6-9]\d{9}$/;
    setIsMobileNumber(mobileRegex.test(value));
    setIsOtpSent(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || (!password && !isMobileNumber)) {
      setErrorMessage("Please enter all required fields.");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const loginResult = await login(email, password);
      if (loginResult.success) {
        navigate("/dash");
        showToast("Logged in Successfully", "success");
        localStorage.setItem("name", loginResult.name);
        localStorage.setItem("email", loginResult.email);
        localStorage.setItem("role", loginResult.role);
      } else {
        setErrorMessage(loginResult.data);
        showToast(loginResult.data, "error");
      }
    } catch (error) {
      setErrorMessage("Failed to login. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const verifyTok = await verifytok();
      if (verifyTok === null) {
        // stay on login
      } else {
        navigate("/dash");
      }
    };
    checkLoginStatus();
  }, [navigate]);

  // --- Theme tokens ---
  const cardBg = useColorModeValue("rgba(255,255,255,0.88)", "rgba(18,18,18,0.82)");
  const cardBorder = useColorModeValue("rgba(255,255,255,0.6)", "whiteAlpha.200");
  const headingColor = useColorModeValue("gray.800", "white");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const inputBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const inputFieldBg = useColorModeValue("white", "whiteAlpha.100");
  const accentBtn = "linear-gradient(94deg, #1C4ED8 0%, #3F77A5 100%)";

  return (
    <Flex
      position="relative"
      h="100vh"
      w="100%"
      alignItems="center"
      justify="center"
    >
      {/* Generic Background Image */}
      {colorMode === "light" ? (
        <Image
          src="/images/bg_light.png"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          zIndex={0}
        />
      ) : (
        <Image
          src="/images/bg_dark.png"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          zIndex={0}
        />
      )}

      {/* Generic Brand Logo Text instead of company logo */}
      <Flex
        position="absolute"
        top={{ base: 4, md: 6 }}
        left={{ base: 4, md: 8 }}
        zIndex={2}
        align="center"
        gap={2}
      >
        <Heading fontSize="20px" fontWeight="700" color={headingColor}>
          CloudVMS
        </Heading>
      </Flex>

      <Flex
        zIndex={1}
        w={{ base: "94%", md: "auto" }}
        maxW="960px"
        borderRadius="24px"
        overflow="hidden"
        boxShadow="0 24px 60px rgba(0,0,0,0.35)"
        border="1px solid"
        borderColor={cardBorder}
        bg={cardBg}
        backdropFilter="blur(24px)"
        direction={{ base: "column", md: "row" }}
      >
        {/* LEFT — Brand panel */}
        <Flex
          direction="column"
          justify="space-between"
          w={{ md: "44%" }}
          p={10}
          display={{ base: "none", md: "flex" }}
          color="#1C4ED8"
        >
          <Heading fontSize="22px" fontWeight="700" color={headingColor}>
            CloudVMS Portal
          </Heading>

          <Flex flex="1" align="center" justify="center" py={6}>
            <Text fontSize="lg" fontWeight="600" color={subColor} textAlign="center">
              [ Dashboard Illustration / Mock Graphic ]
            </Text>
          </Flex>

          <Box>
            <Heading fontSize="24px" fontWeight="700" lineHeight="1.25" mb={2} color={headingColor}>
              Live Video Management System
            </Heading>
            <Text fontSize="13px" color={subColor}>
              Real-time monitoring, playback and analytics.
            </Text>
          </Box>
        </Flex>

        {/* RIGHT — Login form */}
        <Flex direction="column" justify="center" w={{ base: "100%", md: "56%" }} p={{ base: 8, md: 12 }} gap={6}>
          <Box>
            <Heading fontSize={{ base: "26px", md: "30px" }} fontWeight="700" color={headingColor}>
              Welcome back
            </Heading>
            <Text fontSize="14px" color={subColor} mt={1}>
              Sign in to your VMS account to continue
            </Text>
          </Box>

          <form onSubmit={handleLogin}>
            <Flex direction="column" gap={4}>
              {/* Email */}
              <FormControl>
                <FormLabel fontSize="13px" fontWeight="600" color={subColor} mb={1.5}>
                  Email ID
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color={iconColor}>
                    <FaRegEnvelope size={15} />
                  </InputLeftElement>
                  <Input
                    placeholder="Enter your Email ID"
                    value={email}
                    onChange={handleInputChange}
                    borderRadius="12px"
                    bg={inputFieldBg}
                    borderColor={inputBorder}
                    _hover={{ borderColor: "#3F77A5" }}
                    _focus={{ borderColor: "#3F77A5", boxShadow: "0 0 0 1px #3F77A5" }}
                  />
                </InputGroup>
              </FormControl>

              {/* Password */}
              <FormControl>
                <FormLabel fontSize="13px" fontWeight="600" color={subColor} mb={1.5}>
                  Password
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color={iconColor}>
                    <FaLock size={14} />
                  </InputLeftElement>
                  <Input
                    placeholder="Enter your Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderRadius="12px"
                    bg={inputFieldBg}
                    borderColor={inputBorder}
                    _hover={{ borderColor: "#3F77A5" }}
                    _focus={{ borderColor: "#3F77A5", boxShadow: "0 0 0 1px #3F77A5" }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Toggle password visibility"
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((p) => !p)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {errorMessage && (
                <Text fontSize="13px" color="red.400" fontWeight="500">
                  {errorMessage}
                </Text>
              )}

              <Button
                type="submit"
                w="100%"
                mt={1}
                borderRadius="12px"
                bg={accentBtn}
                color="white"
                fontWeight="600"
                size="lg"
                isLoading={isLoading}
                loadingText="Signing in…"
                _hover={{ opacity: 0.92 }}
                _active={{ opacity: 0.85 }}
              >
                Continue
              </Button>
            </Flex>
          </form>

          {/* Authorized access note */}
          <Box borderTop="1px solid" borderColor={inputBorder} pt={4} textAlign="center">
            <Text fontWeight="600" fontSize="14px" color={headingColor}>
              Secure Access Portal
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Login;