'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';

interface SimplifiedDebt {
  from_username: string;
  to_username: string;
  amount: number;
}

interface User {
  id: number;
  username: string;
  lifetime_wins: string;
  lifetime_losses: string;
}

interface Vote {
  user: {
    id: number;
    username: string;
  };
}

export default function LedgerPage() {
  const [simplified, setSimplified] = useState<SimplifiedDebt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch simplified debts
      const simplifiedRes = await fetch('/api/ledger/simplified');
      if (simplifiedRes.ok) {
        const data = await simplifiedRes.json();
        setSimplified(data.simplified);
      }

      // Fetch all users for leaderboard
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }

      // Fetch votes
      const votesRes = await fetch('/api/ledger/vote');
      if (votesRes.ok) {
        const data = await votesRes.json();
        setVotes(data.votes);
      }

      // Fetch current user
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const data = await meRes.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    }
  };

  const vote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ledger/vote', {
        method: 'POST',
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to vote');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetLedger = async () => {
    if (!confirm('Are you sure you want to reset the monthly ledger? This requires 100% consensus.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ledger/reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Monthly ledger reset successfully!');
        fetchData();
      } else {
        alert(data.error || 'Failed to reset ledger');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const hasUserVoted = votes.some((v) => v.user.id === currentUser?.id);
  const allVoted = users.length > 0 && votes.length === users.length;

  // Sort users by lifetime wins
  const sortedUsers = [...users].sort((a, b) => {
    const aWins = parseFloat(a.lifetime_wins);
    const bWins = parseFloat(b.lifetime_wins);
    return bWins - aWins;
  });

  return (
    <div className="space-y-6">
      {/* Lifetime Leaderboard */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Lifetime Leaderboard</CardTitle>
          <CardDescription className="text-zinc-400">
            All-time wins and losses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Rank</TableHead>
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400 text-right">Wins</TableHead>
                <TableHead className="text-zinc-400 text-right">Losses</TableHead>
                <TableHead className="text-zinc-400 text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => {
                const wins = parseFloat(user.lifetime_wins);
                const losses = parseFloat(user.lifetime_losses);
                const net = wins - losses;
                return (
                  <TableRow key={user.id} className="border-zinc-800">
                    <TableCell className="text-zinc-300">{index + 1}</TableCell>
                    <TableCell className="text-white">{user.username}</TableCell>
                    <TableCell className="text-green-400 text-right">
                      {formatCurrency(wins)}
                    </TableCell>
                    <TableCell className="text-red-400 text-right">
                      {formatCurrency(losses)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-zinc-400'
                      }`}
                    >
                      {formatCurrency(net)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Simplified Payouts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Monthly Payouts (Simplified)</CardTitle>
          <CardDescription className="text-zinc-400">
            Minimum transactions needed to settle this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {simplified.length > 0 ? (
            <div className="space-y-3">
              {simplified.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="text-white">
                    <span className="font-semibold">{debt.from_username}</span>
                    <span className="text-zinc-400 mx-2">→</span>
                    <span className="font-semibold">{debt.to_username}</span>
                  </div>
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(debt.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-400 py-8">
              No debts this month. All settled up!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consensus Voting */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Monthly Settlement</CardTitle>
          <CardDescription className="text-zinc-400">
            Vote to finalize and reset the monthly ledger (requires 100% consensus)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">
              Votes: {votes.length} / {users.length}
            </span>
            {allVoted && (
              <Badge className="bg-green-600">Ready to Reset</Badge>
            )}
          </div>

          <div className="space-y-2">
            {users.map((user) => {
              const hasVoted = votes.some((v) => v.user.id === user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded"
                >
                  <span className="text-white">{user.username}</span>
                  {hasVoted ? (
                    <Badge className="bg-green-600">Voted</Badge>
                  ) : (
                    <Badge className="bg-zinc-700">Pending</Badge>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {!hasUserVoted && (
              <Button
                onClick={vote}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Voting...' : 'Confirm Settlement'}
              </Button>
            )}

            {allVoted && (
              <Button
                onClick={resetLedger}
                className="bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Monthly Ledger'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
