import Assumption from './Assumption';
import Context from './Context';
import Goal from './Goal';
import Solution from './Solution';
import Strategy from './Strategy';
import InContextOf from './InContextOf';
import SolvedBy from './SolvedBy';

export { Assumption };
export { Assumption as Justification };
export { Context };
export { Goal };
export { Solution };
export { Strategy };
export { InContextOf };
export { SolvedBy };

export default {
    Assumption,
    Justification: Assumption,
    Goal,
    Solution,
    Strategy,
    Context,
    inContextOf: InContextOf,
    solvedBy: SolvedBy,
};
