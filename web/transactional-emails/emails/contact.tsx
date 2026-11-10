import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export function ContactEmail({
  email,
  message,
  name,
}: {
  email: string;
  message: string;
  name: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New Supanext contact from {name}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "12px",
            margin: "0 auto",
            maxWidth: "600px",
            padding: "32px",
          }}
        >
          <Heading style={{ fontSize: "24px", margin: "0 0 24px" }}>
            New contact message
          </Heading>
          <Section>
            <Text>
              <strong>Name:</strong> {name}
            </Text>
            <Text>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={{ whiteSpace: "pre-wrap" }}>
              <strong>Message:</strong>
              {"\n"}
              {message}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
