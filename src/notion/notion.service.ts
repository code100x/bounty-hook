import { Client } from '@notionhq/client';

type CreatePageArgs = {
  username: string;
  amount: string;
  notion: {
    apiKey: string;
    databaseId: string;
  };
};
export async function addBountyToNotion({
  username,
  amount,
  notion: { apiKey, databaseId },
}: CreatePageArgs) {
  const notion = new Client({
    auth: apiKey,
  });

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Username: {
        title: [
          {
            text: {
              content: username,
            },
          },
        ],
      },
      Amount: {
        rich_text: [
          {
            text: {
              content: amount,
            },
          },
        ],
      },
      Claimed: {
        checkbox: false,
      },
    },
  });
  return response;
}
