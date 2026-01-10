
-- Batch 1: Derivative problems (first 500)
UPDATE problems SET tags = 'derivative,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-sin%';
UPDATE problems SET tags = 'derivative,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-cos%';
UPDATE problems SET tags = 'derivative,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-tan%';
UPDATE problems SET tags = 'derivative,logarithmic', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-ln%';
UPDATE problems SET tags = 'derivative,logarithmic', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-log%';
UPDATE problems SET tags = 'derivative,exponential', difficulty = 'intermediate' WHERE slug LIKE 'derivative-of-e%';
UPDATE problems SET tags = 'derivative,polynomial', difficulty = 'beginner' WHERE slug LIKE 'derivative-of-x%';
UPDATE problems SET tags = 'derivative,fraction', difficulty = 'beginner' WHERE slug LIKE 'derivative-of-1%';

-- Batch 2: Integral problems
UPDATE problems SET tags = 'integral,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'integral-of-sin%';
UPDATE problems SET tags = 'integral,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'integral-of-cos%';
UPDATE problems SET tags = 'integral,logarithmic', difficulty = 'intermediate' WHERE slug LIKE 'integral-of-ln%';
UPDATE problems SET tags = 'integral,exponential', difficulty = 'intermediate' WHERE slug LIKE 'integral-of-e%';
UPDATE problems SET tags = 'integral,polynomial', difficulty = 'beginner' WHERE slug LIKE 'integral-of-x%';

-- Batch 3: Limit problems  
UPDATE problems SET tags = 'limit,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'limit-of-sin%';
UPDATE problems SET tags = 'limit,trigonometric', difficulty = 'intermediate' WHERE slug LIKE 'limit-of-cos%';
UPDATE problems SET tags = 'limit,fraction', difficulty = 'beginner' WHERE slug LIKE 'limit-of-1%';
UPDATE problems SET tags = 'limit,polynomial', difficulty = 'beginner' WHERE slug LIKE 'limit-of-x%';

-- Batch 4: Matrix problems
UPDATE problems SET tags = 'matrix,determinant', difficulty = 'beginner' WHERE slug LIKE '%determinant%';
UPDATE problems SET tags = 'matrix,inverse', difficulty = 'intermediate' WHERE slug LIKE '%inverse%';
UPDATE problems SET tags = 'matrix,eigenvalue', difficulty = 'advanced' WHERE slug LIKE '%eigen%';

