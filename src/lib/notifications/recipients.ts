// Turns "voter voted for post" rows into one recipient per email address, so someone who
// voted from two browsers, or for several of the ideas, gets a single email.

export type VoteRow = {
  voterId: string;
  email: string;
  name: string | null;
  postId: string;
  title: string;
};

export type Recipient = {
  voterId: string;
  email: string;
  name: string | null;
  posts: { id: string; title: string }[];
};

export function groupRecipients(rows: VoteRow[]): Recipient[] {
  const byEmail = new Map<string, Recipient>();
  for (const row of rows) {
    const recipient = byEmail.get(row.email) ?? {
      voterId: row.voterId,
      email: row.email,
      name: null,
      posts: [],
    };
    recipient.name ??= row.name;
    if (!recipient.posts.some((post) => post.id === row.postId)) {
      recipient.posts.push({ id: row.postId, title: row.title });
    }
    byEmail.set(row.email, recipient);
  }
  return [...byEmail.values()];
}
