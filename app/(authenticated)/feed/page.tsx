'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format';

interface Bet {
  id: number;
  text_raw: string;
  condition: string;
  wager_amount: string;
  status: string;
  created_at: string;
  creator: {
    id: number;
    username: string;
  };
  takers: Array<{
    user_id: number;
    user: {
      id: number;
      username: string;
    };
  }>;
}

interface User {
  id: number;
  username: string;
}

export default function FeedPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBets();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    // We'll get this from the session - for now, we'll extract from the first bet or API call
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      setCurrentUser(data.user);
    }
  };

  const fetchBets = async () => {
    try {
      const response = await fetch('/api/bets');
      if (response.ok) {
        const data = await response.json();
        setBets(data.bets);
      }
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  };

  const createBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create bet');
        setLoading(false);
        return;
      }

      setRawInput('');
      fetchBets();
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const takeBet = async (betId: number) => {
    try {
      const response = await fetch(`/api/bets/${betId}/take`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to take bet');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const settleBet = async (betId: number, outcome: 'CREATOR_WON' | 'TAKERS_WON') => {
    try {
      const response = await fetch(`/api/bets/${betId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });

      if (response.ok) {
        fetchBets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to settle bet');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const isUserTaker = (bet: Bet, userId: number | undefined) => {
    if (!userId) return false;
    return bet.takers.some((t) => t.user_id === userId);
  };

  const isUserParticipant = (bet: Bet, userId: number | undefined) => {
    if (!userId) return false;
    return bet.creator.id === userId || isUserTaker(bet, userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-600';
      case 'ACTIVE':
        return 'bg-green-600';
      case 'CREATOR_WON':
        return 'bg-purple-600';
      case 'TAKERS_WON':
        return 'bg-orange-600';
      case 'VOID':
        return 'bg-gray-600';
      default:
        return 'bg-zinc-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Create a Bet</CardTitle>
          <CardDescription className="text-zinc-400">
            Use natural language: "I bet $20 the Warriors win tonight"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createBet} className="space-y-4">
            <Input
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="I bet $50 that..."
              className="bg-zinc-800 border-zinc-700 text-white"
              required
              minLength={10}
              disabled={loading}
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Bet'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {bets.map((bet) => (
          <Card key={bet.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(bet.status)}>
                      {bet.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {formatCurrency(bet.wager_amount)}
                    </span>
                  </div>
                  <CardTitle className="text-white">{bet.condition}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Created by {bet.creator.username} •{' '}
                    {formatRelativeTime(new Date(bet.created_at))}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bet.takers.length > 0 && (
                <div className="mb-4 text-sm text-zinc-400">
                  Takers: {bet.takers.map((t) => t.user.username).join(', ')}
                </div>
              )}

              <div className="flex gap-2">
                {(bet.status === 'OPEN' || bet.status === 'ACTIVE') &&
                  currentUser &&
                  bet.creator.id !== currentUser.id &&
                  !isUserTaker(bet, currentUser.id) && (
                    <Button
                      onClick={() => takeBet(bet.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Take Bet
                    </Button>
                  )}

                {isUserTaker(bet, currentUser?.id) &&
                  (bet.status === 'OPEN' || bet.status === 'ACTIVE') && (
                    <Badge className="bg-green-600">You're In</Badge>
                  )}

                {bet.status === 'ACTIVE' &&
                  currentUser &&
                  isUserParticipant(bet, currentUser.id) && (
                    <>
                      <Button
                        onClick={() => settleBet(bet.id, 'CREATOR_WON')}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        Creator Won
                      </Button>
                      <Button
                        onClick={() => settleBet(bet.id, 'TAKERS_WON')}
                        className="bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        Takers Won
                      </Button>
                    </>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}

        {bets.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center text-zinc-400">
              No bets yet. Create the first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
