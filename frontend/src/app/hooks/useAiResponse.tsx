import { useContext, useEffect } from "react";
import { responseFromChatOpenAi } from "../api/langchain";
import { Message } from "@/lib/types";
import { MessageContext } from "../useContext/message-context";
import { useParams } from "next/navigation";
import { useLocalStorage } from "./useLocalStorage";
import { pricePridictionHandle } from "@/lib/allora";
import { checkBalance } from "./useBalanceResponse";
import { getTokenTickerData } from "./useGetTokensSticker";

export function useAiResponse(
  pendingMessage: string | null,
  setPendingMessage: (e: null) => void
) {
  const { messages, setMessages } = useContext(MessageContext);
  const params = useParams();
  const chatId = params.chatid as string;
  const { setMessagesInStorage } = useLocalStorage(chatId);

  useEffect(() => {
    async function getAIResponse() {
      if (!pendingMessage) return;

      try {
        const airResponse = await responseFromChatOpenAi(pendingMessage);
        console.log(airResponse);

        switch (airResponse?.intent) {
          case "swap":
            const aiMessage: Message = {
              content: airResponse?.generalResponse ?? "",
              sender: "agent",
              id: Date.now().toString(),
              agentName: "user",
              intent: "swap",
            };
            setMessagesInStorage([...messages, aiMessage]);
            setMessages((messages) => [...messages, aiMessage]);
            break;
          case "checkBalance":
            // If no token specified, ask which token they want to check
            if (!airResponse.sourceToken) {
              const promptMessage: Message = {
                content:
                  "Which token's balance would you like to check? (e.g., S, ANON, etc.)",
                sender: "agent",
                id: Date.now().toString(),
                agentName: "zerepy",
                intent: "checkBalance",
              };
              setMessagesInStorage([...messages, promptMessage]);
              setMessages((messages) => [...messages, promptMessage]);
            }
            // For S token, show balance directly
            else if (airResponse.sourceToken.toUpperCase() === "S") {
              const balanceData = await checkBalance();
              const balanceMessage: Message = {
                content: balanceData?.result
                  ? `Your S token balance is ${balanceData.result}`
                  : "Sorry, I couldn't fetch your S token balance at the moment.",
                sender: "agent",
                id: Date.now().toString(),
                agentName: "zerepy",
                intent: "checkBalance",
              };
              setMessagesInStorage([...messages, balanceMessage]);
              setMessages((messages) => [...messages, balanceMessage]);
            }
            // For other tokens, ask for the addresses
            else {
              const promptMessage: Message = {
                content: `For checking ${airResponse.sourceToken} balance, please provide:\n1. Wallet address\n2. Token contract address\n\nFormat: wallet:YOUR_WALLET_ADDRESS token:TOKEN_CONTRACT_ADDRESS`,
                sender: "agent",
                id: Date.now().toString(),
                agentName: "zerepy",
                intent: "checkBalance",
                tokenName: airResponse.sourceToken,
              };
              setMessagesInStorage([...messages, promptMessage]);
              setMessages((messages) => [...messages, promptMessage]);
            }
            break;
          case "checkBalance_addresses":
            if (airResponse?.walletAddress && airResponse?.tokenAddress) {
              const balanceData = await checkBalance(
                airResponse.walletAddress,
                airResponse.tokenAddress
              );
              const balanceMessage: Message = {
                content: balanceData?.result
                  ? `The balance for this token is ${balanceData.result}`
                  : "Sorry, I couldn't fetch the balance for this token address.",
                sender: "agent",
                id: Date.now().toString(),
                agentName: "zerepy",
                intent: "checkBalance",
              };
              setMessagesInStorage([...messages, balanceMessage]);
              setMessages((messages) => [...messages, balanceMessage]);
            }
            break;
          case "getTokenTicker":
            if (!airResponse.sourceToken) {
              const promptMessage: Message = {
                content:
                  "Please provide the token name for which you would like to get the ticker (e.g., ANON, BTC, etc.)",
                sender: "agent",
                id: Date.now().toString(),
                agentName: "zerepy",
                intent: "getTokenTicker",
              };
              setMessagesInStorage([...messages, promptMessage]);
              setMessages((messages) => [...messages, promptMessage]);
            }
            // If token is specified, get the ticker
            else {
              try {
                const tokenTickerData = await getTokenTickerData(
                  airResponse.sourceToken
                );
                const tickerMessage: Message = {
                  content: tokenTickerData?.result
                    ? `Here's the token address for ${airResponse.sourceToken}: ${tokenTickerData.result}`
                    : `Sorry, I couldn't find the ticker for ${airResponse.sourceToken}.`,
                  sender: "agent",
                  id: Date.now().toString(),
                  agentName: "zerepy",
                  intent: "getTokenTicker",
                  tokenName: airResponse.sourceToken,
                };
                setMessagesInStorage([...messages, tickerMessage]);
                setMessages((messages) => [...messages, tickerMessage]);
              } catch {
                const errorMessage: Message = {
                  content: `Sorry, I encountered an error while fetching the ticker for ${airResponse.sourceToken}.`,
                  sender: "agent",
                  id: Date.now().toString(),
                  agentName: "zerepy",
                  intent: "getTokenTicker",
                };
                setMessagesInStorage([...messages, errorMessage]);
                setMessages((messages) => [...messages, errorMessage]);
              }
            }
            break;
          case "normalChat":
            const aiNormlChat: Message = {
              content: airResponse?.generalResponse ?? "",
              sender: "agent",
              id: Date.now().toString(),
              agentName: "user",
              intent: "normalChat",
            };
            setMessagesInStorage([...messages, aiNormlChat]);
            setMessages((messages) => [...messages, aiNormlChat]);
            break;
          case "prediction":
            console.log(airResponse);
            pricePridictionHandle(
              airResponse.pridictTokenName ?? "",
              airResponse.generalResponse,
              messages,
              setMessages,
              setMessagesInStorage
            );

            break;
          case "transfer":
            const aiTransfer: Message = {
              content: airResponse?.generalResponse ?? "",
              sender: "agent",
              id: Date.now().toString(),
              agentName: "user",
              intent: "transfer",
            };
            setMessagesInStorage([...messages, aiTransfer]);
            setMessages((messages) => [...messages, aiTransfer]);
            break;
          case "unknown":
            const aiUnKnownMessage: Message = {
              content: airResponse?.generalResponse ?? "",
              sender: "agent",
              id: Date.now().toString(),
              agentName: "user",
              intent: "unknown",
            };
            setMessagesInStorage([...messages, aiUnKnownMessage]);
            setMessages((messages) => [...messages, aiUnKnownMessage]);
            break;
          default:
            const aiDefaultMessage: Message = {
              content: airResponse?.generalResponse ?? "",
              sender: "agent",
              id: Date.now().toString(),
              agentName: "user",
              intent: "normalChat",
            };
            setMessagesInStorage([...messages, aiDefaultMessage]);
            setMessages((messages) => [...messages, aiDefaultMessage]);
        }
      } catch (err) {
        console.error(err);
        const errorMessage: Message = {
          content: "Sorry, I encountered an error processing your request.",
          sender: "agent",
          id: Date.now().toString(),
          agentName: "user",
          intent: "unknown",
        };

        setMessages((messages) => [...messages, errorMessage]);
        setMessagesInStorage([...messages, errorMessage]);
      }

      setPendingMessage(null);
    }

    getAIResponse();
  }, [pendingMessage]);
}
