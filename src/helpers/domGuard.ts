// Browser translation and some extensions (ad blockers, antivirus link checkers)
// move or wrap page elements that React manages. React then fails with
// "Failed to execute 'removeChild' / 'insertBefore' on 'Node'" and the whole
// page goes blank. These guards skip the impossible DOM operation instead of
// throwing, so the page keeps working. See facebook/react#11538.

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      console.warn("removeChild skipped: the node was moved by a translator or an extension", child);
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    if (child && child.parentNode !== this) {
      console.warn("insertBefore skipped: the node was moved by a translator or an extension", child);
      return node;
    }
    return originalInsertBefore.call(this, node, child) as T;
  };
}

export {};
